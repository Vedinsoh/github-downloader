import { describe, expect, it } from "vitest";
import { releaseSchema, repoSchema } from "./schemas";

describe("repoSchema", () => {
  it("parses minimal valid repo", () => {
    const result = repoSchema.safeParse({
      full_name: "redis/redis",
      name: "redis",
      description: "Redis is an in-memory database",
      archived: false,
      html_url: "https://github.com/redis/redis",
      owner: {
        login: "redis",
        avatar_url: "https://avatars.githubusercontent.com/u/1529926?v=4",
        html_url: "https://github.com/redis",
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts null description", () => {
    const result = repoSchema.safeParse({
      full_name: "user/repo",
      name: "repo",
      description: null,
      archived: false,
      html_url: "https://github.com/user/repo",
      owner: {
        login: "user",
        avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
        html_url: "https://github.com/user",
      },
    });
    expect(result.success).toBe(true);
  });
});

describe("releaseSchema", () => {
  it("parses release with assets", () => {
    const result = releaseSchema.safeParse({
      id: 1,
      tag_name: "v8.0.1",
      name: "Redis 8.0.1",
      draft: false,
      prerelease: false,
      published_at: "2025-01-01T00:00:00Z",
      html_url: "https://github.com/redis/redis/releases/tag/v8.0.1",
      assets: [
        {
          id: 1,
          name: "redis-8.0.1-linux-x64.tar.gz",
          size: 1000,
          download_count: 0,
          browser_download_url: "https://github.com/x/y",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("parses release with empty assets", () => {
    const result = releaseSchema.safeParse({
      id: 1,
      tag_name: "v1.0.0",
      name: null,
      draft: false,
      prerelease: false,
      published_at: null,
      html_url: "https://github.com/x/y",
      assets: [],
    });
    expect(result.success).toBe(true);
  });
});
