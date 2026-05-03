import { describe, expect, it } from "vitest";
import { mergeNewTags } from "./tags-index";
import type { StoredTagsIndex } from "./schemas";

function index(tags: string[], complete = true): StoredTagsIndex {
  return { tags, complete, cursor: null, fetchedAt: 1 };
}

describe("mergeNewTags", () => {
  it("prepends new tags before existing, no duplicates", () => {
    const result = mergeNewTags(index(["v1", "v0"]), ["v3", "v2", "v1"]);
    expect(result.tags).toEqual(["v3", "v2", "v1", "v0"]);
  });

  it("empty incoming returns existing unchanged (same reference)", () => {
    const existing = index(["v1"]);
    expect(mergeNewTags(existing, [])).toBe(existing);
  });

  it("incomplete index unchanged by merge", () => {
    const existing = index(["v1"], false);
    expect(mergeNewTags(existing, ["v2"])).toBe(existing);
  });

  it("all-known incoming returns existing unchanged", () => {
    const existing = index(["v2", "v1"]);
    expect(mergeNewTags(existing, ["v2", "v1"])).toBe(existing);
  });
});
