import { describe, expect, it } from "vitest";
import { computeLatestStable } from "./latest-stable";
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
