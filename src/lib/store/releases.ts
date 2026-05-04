import { unstable_cache } from "next/cache";
import type { FetchError } from "@/lib/github/client";
import { fetchLatestRelease, fetchReleasesChunk, fetchReleaseByTagRaw } from "@/lib/github/client";
import { computeLatestStable } from "./latest-stable";
import { mergeReleases } from "./merge";
import { getJSON, repoReleasesKey, repoTagsKey, setJSON, UnavailableError } from "./redis";
import { storedReleaseSetSchema, type StoredRelease, type StoredReleaseSet } from "./schemas";
import { CHUNK_SIZE, PAGE_SIZE, sliceForPage } from "./slice";
import { ensureTagsIndex, getTagsIndex, mergeNewTags } from "./tags-index";
import { toStored } from "./to-stored";

const MAX_EXPANSIONS = 5;
const CACHE_TTL_SECONDS = 6 * 60 * 60;

export type GetReleasesPageResult =
  | {
      ok: true;
      releases: StoredRelease[];
      hasMore: boolean;
      latestStable: StoredRelease | null;
    }
  | { ok: false; error: FetchError | { kind: "unavailable" } };

export type GetReleaseByTagResult =
  | { ok: true; release: StoredRelease }
  | { ok: false; error: FetchError | { kind: "unavailable" } };

async function readBlob(owner: string, repo: string): Promise<StoredReleaseSet | null> {
  const raw = await getJSON<unknown>(repoReleasesKey(owner, repo));
  if (!raw) return null;
  const parsed = storedReleaseSetSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

async function loadOrSeedBlob(
  owner: string,
  repo: string,
  existing: StoredReleaseSet | null,
): Promise<{ ok: true; blob: StoredReleaseSet } | { ok: false; error: FetchError }> {
  if (existing) return { ok: true, blob: existing };

  const [chunkResult, latestResult] = await Promise.all([
    fetchReleasesChunk(owner, repo, 1),
    fetchLatestRelease(owner, repo),
  ]);
  if (!chunkResult.ok) return chunkResult;

  const chunkStored = chunkResult.data.releases.map(toStored);
  let releases = chunkStored;
  if (latestResult.ok) {
    const latestStored = toStored(latestResult.data);
    if (!chunkStored.some((r) => r.tag === latestStored.tag)) {
      releases = mergeReleases([latestStored], chunkStored);
    }
  }

  const blob: StoredReleaseSet = {
    chunks: 1,
    releases,
    hasMore: chunkResult.data.hasMore,
    fetchedAt: Date.now(),
  };
  await setJSON(repoReleasesKey(owner, repo), blob);

  // Opportunistic tag-index sync — append fresh tags to a complete index.
  await syncTagsIndex(
    owner,
    repo,
    releases.map((r) => r.tag),
  );

  return { ok: true, blob };
}

async function syncTagsIndex(owner: string, repo: string, newTags: string[]) {
  const existing = await getTagsIndex(owner, repo).catch(() => null);
  if (!existing || !existing.complete) return;
  const updated = mergeNewTags(existing, newTags);
  if (updated === existing) return;
  await setJSON(repoTagsKey(owner, repo), updated);
}

async function getReleasesPageInner(
  owner: string,
  repo: string,
  page: number,
  includeBetas: boolean,
): Promise<GetReleasesPageResult> {
  let initial: StoredReleaseSet | null;
  try {
    initial = await readBlob(owner, repo);
  } catch (err) {
    if (err instanceof UnavailableError) {
      return { ok: false, error: { kind: "unavailable" } };
    }
    throw err;
  }

  const seeded = await loadOrSeedBlob(owner, repo, initial);
  if (!seeded.ok) return { ok: false, error: seeded.error };
  let blob: StoredReleaseSet = seeded.blob;

  for (let iterations = 0; iterations <= MAX_EXPANSIONS; iterations++) {
    const slice = sliceForPage(blob, page, PAGE_SIZE, includeBetas);
    const visible = blob.releases.slice(0, blob.chunks * CHUNK_SIZE);
    const filtered = includeBetas ? visible : visible.filter((r) => !r.pre);
    const needed = page * PAGE_SIZE;
    const latestStable = computeLatestStable(blob.releases);
    const haveEnough = filtered.length >= needed;

    if (haveEnough) {
      return {
        ok: true,
        releases: slice.releases,
        hasMore: slice.hasMore,
        latestStable,
      };
    }
    if (!blob.hasMore || iterations >= MAX_EXPANSIONS) {
      return {
        ok: true,
        releases: slice.releases,
        hasMore: slice.hasMore,
        latestStable,
      };
    }

    const nextChunk = blob.chunks + 1;
    const fetched = await fetchReleasesChunk(owner, repo, nextChunk);
    if (!fetched.ok) return { ok: false, error: fetched.error };

    const stored = fetched.data.releases.map(toStored);
    blob = {
      chunks: nextChunk,
      releases: mergeReleases(blob.releases, stored),
      hasMore: fetched.data.hasMore,
      fetchedAt: Date.now(),
    };
    await setJSON(repoReleasesKey(owner, repo), blob);
  }

  // Unreachable, but fall through with whatever we have.
  const slice = sliceForPage(blob, page, PAGE_SIZE, includeBetas);
  return {
    ok: true,
    releases: slice.releases,
    hasMore: slice.hasMore,
    latestStable: computeLatestStable(blob.releases),
  };
}

export async function getReleasesPage(
  owner: string,
  repo: string,
  page: number,
  includeBetas: boolean,
): Promise<GetReleasesPageResult> {
  const cached = unstable_cache(
    async () => getReleasesPageInner(owner, repo, page, includeBetas),
    ["releases", owner, repo, String(page), String(includeBetas)],
    { revalidate: CACHE_TTL_SECONDS, tags: [`repo:${owner}/${repo}`] },
  );
  return cached();
}

async function getReleaseByTagInner(
  owner: string,
  repo: string,
  tag: string,
): Promise<GetReleaseByTagResult> {
  let blob: StoredReleaseSet | null;
  try {
    blob = await readBlob(owner, repo);
  } catch (err) {
    if (err instanceof UnavailableError) {
      return { ok: false, error: { kind: "unavailable" } };
    }
    throw err;
  }

  const fromBlob = blob?.releases.find((r) => r.tag === tag);
  if (fromBlob) return { ok: true, release: fromBlob };

  const ensured = await ensureTagsIndex(owner, repo);
  if (!ensured.ok) return { ok: false, error: ensured.error };

  if (ensured.index.complete && !ensured.index.tags.includes(tag)) {
    return { ok: false, error: { kind: "not_found" } };
  }

  const fetched = await fetchReleaseByTagRaw(owner, repo, tag);
  if (!fetched.ok) return { ok: false, error: fetched.error };

  const stored = toStored(fetched.data);
  const merged = mergeReleases(blob?.releases ?? [], [stored]);
  const next: StoredReleaseSet = {
    chunks: blob?.chunks ?? 0,
    releases: merged,
    hasMore: blob?.hasMore ?? true,
    fetchedAt: Date.now(),
  };
  await setJSON(repoReleasesKey(owner, repo), next);
  return { ok: true, release: stored };
}

export async function getReleaseByTag(
  owner: string,
  repo: string,
  tag: string,
): Promise<GetReleaseByTagResult> {
  const cached = unstable_cache(
    async () => getReleaseByTagInner(owner, repo, tag),
    ["release-tag", owner, repo, tag],
    { revalidate: CACHE_TTL_SECONDS, tags: [`repo:${owner}/${repo}`] },
  );
  return cached();
}
