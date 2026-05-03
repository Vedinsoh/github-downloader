import { describe, expect, it } from "vitest";
import { parseRepoInput } from "./parse-input";

describe("parseRepoInput", () => {
  const ok = (input: string, owner: string, repo: string) =>
    expect(parseRepoInput(input)).toEqual({ ok: true, owner, repo });

  const okVersion = (input: string, owner: string, repo: string, version: string) =>
    expect(parseRepoInput(input)).toEqual({
      ok: true,
      owner,
      repo,
      version,
    });

  const fail = (input: string) => expect(parseRepoInput(input).ok).toBe(false);

  it("accepts owner/repo", () => ok("redis/redis", "redis", "redis"));
  it("accepts github.com URL", () => ok("github.com/redis/redis", "redis", "redis"));
  it("accepts https URL", () => ok("https://github.com/redis/redis", "redis", "redis"));
  it("accepts /releases suffix", () =>
    ok("https://github.com/redis/redis/releases", "redis", "redis"));
  it("accepts /releases/tag suffix and extracts version", () =>
    okVersion("https://github.com/redis/redis/releases/tag/v8.0.1", "redis", "redis", "v8.0.1"));
  it("accepts /releases/download suffix and extracts version", () =>
    okVersion(
      "https://github.com/redis/redis/releases/download/v8.0.1/redis.zip",
      "redis",
      "redis",
      "v8.0.1",
    ));
  it("accepts /releases/latest with no version", () =>
    ok("https://github.com/redis/redis/releases/latest", "redis", "redis"));
  it("accepts /issues suffix with no version", () =>
    ok("https://github.com/redis/redis/issues", "redis", "redis"));
  it("accepts .git suffix", () => ok("https://github.com/redis/redis.git", "redis", "redis"));
  it("accepts trailing slash", () => ok("redis/redis/", "redis", "redis"));
  it("accepts www prefix", () => ok("www.github.com/redis/redis", "redis", "redis"));
  it("accepts hyphenated names", () => ok("vercel/next.js", "vercel", "next.js"));
  it("accepts numeric names", () => ok("user123/repo456", "user123", "repo456"));
  it("accepts dashes in repo", () => ok("godotengine/godot-builds", "godotengine", "godot-builds"));

  it("rejects empty input", () => fail(""));
  it("rejects whitespace only", () => fail("   "));
  it("rejects single segment", () => fail("redis"));
  it("rejects reserved owner: api", () => fail("api/foo"));
  it("rejects reserved owner: about", () => fail("about/foo"));
  it("rejects owner starting with hyphen", () => fail("-bad/repo"));
  it("rejects owner ending with hyphen", () => fail("bad-/repo"));
  it("rejects double-dot repo", () => fail("user/.."));
  it("rejects single-dot repo", () => fail("user/."));
  it("rejects too-long owner", () => fail("a".repeat(40) + "/repo"));
  it("rejects garbage", () => fail("just some text"));
});
