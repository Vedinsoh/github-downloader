import type { FetchError } from "@/lib/github/client";
import { pickLatest } from "./latest-stable";
import { getOrSeedBlob } from "./releases";

export type ResolveLatestResult =
  | { ok: true; tag: string }
  | { ok: false; error: FetchError | { kind: "unavailable" } | { kind: "no_releases" } };

export async function resolveLatestTag(owner: string, repo: string): Promise<ResolveLatestResult> {
  const seeded = await getOrSeedBlob(owner, repo);
  if (!seeded.ok) return { ok: false, error: seeded.error };
  const picked = pickLatest(seeded.blob.releases);
  if (!picked) return { ok: false, error: { kind: "no_releases" } };
  return { ok: true, tag: picked.tag };
}
