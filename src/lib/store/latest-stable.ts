import type { StoredRelease } from "./schemas";

export function computeLatestStable(releases: StoredRelease[]): StoredRelease | null {
  for (const r of releases) {
    if (!r.pre) return r;
  }
  return null;
}
