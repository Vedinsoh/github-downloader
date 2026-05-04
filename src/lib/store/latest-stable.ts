import type { StoredRelease } from "./schemas";

export function computeLatestStable(releases: StoredRelease[]): StoredRelease | null {
  for (const r of releases) {
    if (!r.pre) return r;
  }
  return null;
}

export function pickLatest(releases: StoredRelease[]): StoredRelease | null {
  return computeLatestStable(releases) ?? releases[0] ?? null;
}
