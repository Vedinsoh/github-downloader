import { describe, expect, it } from "vitest";
import { sliceForPage } from "./slice";
import type { StoredRelease, StoredReleaseSet } from "./schemas";

function rel(tag: string, pre = false): StoredRelease {
  return { tag, pre, date: "2026-01-01T00:00:00Z", assets: [] };
}

function blob(releases: StoredRelease[], chunks: number, hasMore = false): StoredReleaseSet {
  return { releases, chunks, hasMore, fetchedAt: Date.now() };
}

describe("sliceForPage", () => {
  it("filters out prereleases when includeBetas=false", () => {
    const set = blob([rel("v3", true), rel("v2", false), rel("v1", false)], 1);
    const result = sliceForPage(set, 1, 10, false);
    expect(result.releases.map((r) => r.tag)).toEqual(["v2", "v1"]);
  });

  it("includes prereleases when includeBetas=true", () => {
    const set = blob([rel("v3", true), rel("v2", false)], 1);
    const result = sliceForPage(set, 1, 10, true);
    expect(result.releases).toHaveLength(2);
  });

  it("page 2 with pageSize 10 returns indices 10-19", () => {
    const releases = Array.from({ length: 25 }, (_, i) => rel(`v${i}`));
    const set = blob(releases, 1);
    const result = sliceForPage(set, 2, 10, true);
    expect(result.releases.map((r) => r.tag)).toEqual(
      Array.from({ length: 10 }, (_, i) => `v${i + 10}`),
    );
  });

  it("hasMore reflects underlying filtered length vs blob.hasMore", () => {
    const releases = Array.from({ length: 12 }, (_, i) => rel(`v${i}`));
    const set = blob(releases, 1, false);
    const page1 = sliceForPage(set, 1, 10, true);
    expect(page1.hasMore).toBe(true);
    const page2 = sliceForPage(set, 2, 10, true);
    expect(page2.hasMore).toBe(false);
  });

  it("never reads beyond chunks * CHUNK_SIZE (singletons invisible to pagination)", () => {
    // 25 entries but chunks=1 (CHUNK_SIZE=20) — only first 20 visible.
    const many = Array.from({ length: 25 }, (_, i) => rel(`v${i}`));
    const set = blob(many, 1);
    const result = sliceForPage(set, 1, 100, true);
    expect(result.releases).toHaveLength(20);
    expect(result.releases.map((r) => r.tag)).not.toContain("v20");
  });
});
