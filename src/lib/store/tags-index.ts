import type { FetchError } from "@/lib/github/client";
import { walkReleaseTags } from "@/lib/github/graphql";
import { storedTagsIndexSchema, type StoredTagsIndex } from "./schemas";
import { getJSON, repoTagsKey, setJSON } from "./redis";

export type TagsIndexResult =
  | { ok: true; index: StoredTagsIndex }
  | { ok: false; error: FetchError };

export async function getTagsIndex(owner: string, repo: string): Promise<StoredTagsIndex | null> {
  const raw = await getJSON<unknown>(repoTagsKey(owner, repo));
  if (!raw) return null;
  const parsed = storedTagsIndexSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function buildTagsIndex(
  owner: string,
  repo: string,
  fromCursor: string | null,
  seedTags: string[] = [],
): Promise<TagsIndexResult> {
  const accumulator = [...seedTags];
  let cursor = fromCursor;

  // Cap iterations to defend against pathological repos.
  for (let i = 0; i < 100; i++) {
    const page = await walkReleaseTags(owner, repo, cursor);
    if (!page.ok) return page;

    accumulator.push(...page.data.tags);
    cursor = page.data.endCursor;

    if (!page.data.hasNextPage) {
      const index: StoredTagsIndex = {
        tags: accumulator,
        complete: true,
        cursor: null,
        fetchedAt: Date.now(),
      };
      await setJSON(repoTagsKey(owner, repo), index);
      return { ok: true, index };
    }

    const partial: StoredTagsIndex = {
      tags: accumulator,
      complete: false,
      cursor,
      fetchedAt: Date.now(),
    };
    await setJSON(repoTagsKey(owner, repo), partial);
  }

  // Hit iteration cap — return last partial so caller can decide.
  const partial: StoredTagsIndex = {
    tags: accumulator,
    complete: false,
    cursor,
    fetchedAt: Date.now(),
  };
  return { ok: true, index: partial };
}

export async function ensureTagsIndex(owner: string, repo: string): Promise<TagsIndexResult> {
  const existing = await getTagsIndex(owner, repo);
  if (existing && existing.complete) return { ok: true, index: existing };
  if (existing) {
    return buildTagsIndex(owner, repo, existing.cursor, existing.tags);
  }
  return buildTagsIndex(owner, repo, null, []);
}

/**
 * Prepend any tags from a freshly-fetched chunk that aren't already at the
 * head of the existing index. No GH calls; pure merge over data we already
 * have. Only mutates a complete index — partial indices stay untouched.
 */
export function mergeNewTags(existing: StoredTagsIndex, newTags: string[]): StoredTagsIndex {
  if (!existing.complete) return existing;
  if (newTags.length === 0) return existing;
  const known = new Set(existing.tags);
  const additions = newTags.filter((t) => !known.has(t));
  if (additions.length === 0) return existing;
  return {
    ...existing,
    tags: [...additions, ...existing.tags],
    fetchedAt: Date.now(),
  };
}
