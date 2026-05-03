import { describe, expect, it } from "vitest";
import { mergeReleases } from "./merge";
import type { StoredRelease } from "./schemas";

function rel(tag: string, date: string | null, pre = false): StoredRelease {
  return { tag, pre, date, assets: [] };
}

describe("mergeReleases", () => {
  it("merging disjoint lists yields union sorted by date desc", () => {
    const a = [rel("v1", "2026-01-01T00:00:00Z")];
    const b = [rel("v2", "2026-02-01T00:00:00Z")];
    const merged = mergeReleases(a, b);
    expect(merged.map((r) => r.tag)).toEqual(["v2", "v1"]);
  });

  it("incoming wins on duplicate tag", () => {
    const existing = [rel("v1", "2026-01-01T00:00:00Z")];
    const incoming = [
      { ...rel("v1", "2026-03-01T00:00:00Z"), assets: [{ name: "x", size: 1, url: "u" }] },
    ];
    const merged = mergeReleases(existing, incoming);
    expect(merged).toHaveLength(1);
    expect(merged[0].assets).toHaveLength(1);
    expect(merged[0].date).toBe("2026-03-01T00:00:00Z");
  });

  it("null dates sort last", () => {
    const a = [rel("v1", null)];
    const b = [rel("v2", "2026-01-01T00:00:00Z")];
    const merged = mergeReleases(a, b);
    expect(merged.map((r) => r.tag)).toEqual(["v2", "v1"]);
  });

  it("empty incoming returns existing unchanged", () => {
    const existing = [rel("v1", "2026-01-01T00:00:00Z")];
    expect(mergeReleases(existing, [])).toBe(existing);
  });
});
