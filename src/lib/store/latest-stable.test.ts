import { describe, expect, it } from "vitest";
import { computeLatestStable, pickLatest } from "./latest-stable";
import type { StoredRelease } from "./schemas";

function rel(tag: string, pre = false): StoredRelease {
  return { tag, pre, date: "2026-01-01T00:00:00Z", assets: [] };
}

describe("computeLatestStable", () => {
  it("returns first non-prerelease in input order", () => {
    const result = computeLatestStable([rel("v3", true), rel("v2", true), rel("v1", false)]);
    expect(result?.tag).toBe("v1");
  });

  it("all-prerelease list returns null", () => {
    expect(computeLatestStable([rel("v2", true), rel("v1", true)])).toBeNull();
  });

  it("empty list returns null", () => {
    expect(computeLatestStable([])).toBeNull();
  });
});

describe("pickLatest", () => {
  it("prefers stable when present", () => {
    const result = pickLatest([rel("v3", true), rel("v2", false), rel("v1", true)]);
    expect(result?.tag).toBe("v2");
  });

  it("falls back to first when all prerelease", () => {
    const result = pickLatest([rel("v3", true), rel("v2", true)]);
    expect(result?.tag).toBe("v3");
  });

  it("empty list returns null", () => {
    expect(pickLatest([])).toBeNull();
  });
});
