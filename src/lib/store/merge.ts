import type { StoredRelease } from "./schemas";

function dateRank(date: string | null): number {
  if (!date) return -Infinity;
  const t = Date.parse(date);
  return Number.isNaN(t) ? -Infinity : t;
}

export function mergeReleases(
  existing: StoredRelease[],
  incoming: StoredRelease[],
): StoredRelease[] {
  if (incoming.length === 0) return existing;
  const byTag = new Map<string, StoredRelease>();
  for (const r of existing) byTag.set(r.tag, r);
  for (const r of incoming) byTag.set(r.tag, r);
  const merged = Array.from(byTag.values());
  merged.sort((a, b) => dateRank(b.date) - dateRank(a.date));
  return merged;
}
