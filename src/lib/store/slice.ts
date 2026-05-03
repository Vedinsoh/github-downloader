import type { StoredRelease, StoredReleaseSet } from "./schemas";

export const PAGE_SIZE = 10;
export const CHUNK_SIZE = 30;

export type SliceResult = {
  releases: StoredRelease[];
  hasMore: boolean;
};

export function sliceForPage(
  blob: StoredReleaseSet,
  page: number,
  pageSize: number,
  includeBetas: boolean,
): SliceResult {
  const visible = blob.releases.slice(0, blob.chunks * CHUNK_SIZE);
  const filtered = includeBetas ? visible : visible.filter((r) => !r.pre);

  const start = (page - 1) * pageSize;
  const end = page * pageSize;
  const releases = filtered.slice(start, end);
  const hasMore = filtered.length > end || blob.hasMore;

  return { releases, hasMore };
}
