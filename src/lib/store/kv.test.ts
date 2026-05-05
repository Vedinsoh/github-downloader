import { describe, expect, it } from "vitest";
import { repoCacheTag, repoReleasesKey, repoTagsKey } from "./kv";

describe("kv key builders", () => {
  it("repoReleasesKey lowercases owner and repo", () => {
    expect(repoReleasesKey("Redis", "Redis")).toBe("repo:redis/redis:releases");
    expect(repoReleasesKey("redis", "redis")).toBe(repoReleasesKey("Redis", "Redis"));
    expect(repoReleasesKey("OvenSh", "Bun")).toBe(repoReleasesKey("ovensh", "bun"));
  });

  it("repoTagsKey lowercases owner and repo", () => {
    expect(repoTagsKey("Redis", "Redis")).toBe("repo:redis/redis:tags");
    expect(repoTagsKey("redis", "redis")).toBe(repoTagsKey("Redis", "Redis"));
  });

  it("repoCacheTag lowercases owner and repo", () => {
    expect(repoCacheTag("Redis", "Redis")).toBe("repo:redis/redis");
    expect(repoCacheTag("redis", "redis")).toBe(repoCacheTag("Redis", "Redis"));
  });
});
