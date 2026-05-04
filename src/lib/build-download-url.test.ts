import { describe, expect, it } from "vitest";
import { buildDownloadUrl, hydrateForRender, hydrateRelease } from "./build-download-url";
import type { StoredRelease } from "./store/schemas";

describe("buildDownloadUrl", () => {
  it("builds the canonical GitHub release download URL", () => {
    expect(buildDownloadUrl("oven-sh", "bun", "bun-v1.3.13", "bun-darwin-aarch64.zip")).toBe(
      "https://github.com/oven-sh/bun/releases/download/bun-v1.3.13/bun-darwin-aarch64.zip",
    );
  });

  it("encodes filename with parens", () => {
    expect(buildDownloadUrl("o", "r", "v1", "app (x64).exe")).toBe(
      "https://github.com/o/r/releases/download/v1/app%20(x64).exe",
    );
  });

  it("encodes filename with plus", () => {
    expect(buildDownloadUrl("o", "r", "v1", "app+arm64.dmg")).toBe(
      "https://github.com/o/r/releases/download/v1/app%2Barm64.dmg",
    );
  });

  it("encodes tildes and other safe punctuation passed through", () => {
    expect(buildDownloadUrl("o", "r", "v1", "app~1.0.tar.gz")).toBe(
      "https://github.com/o/r/releases/download/v1/app~1.0.tar.gz",
    );
  });

  it("encodes tag with slashes (release/foo)", () => {
    expect(buildDownloadUrl("o", "r", "release/2026.05", "x.zip")).toBe(
      "https://github.com/o/r/releases/download/release%2F2026.05/x.zip",
    );
  });
});

describe("hydrateRelease / hydrateForRender", () => {
  const release: StoredRelease = {
    tag: "v1.0.0",
    pre: false,
    date: "2026-01-01T00:00:00Z",
    assets: [
      { name: "app-linux-x64.tar.gz", size: 100 },
      { name: "app-windows.exe", size: 200 },
    ],
  };

  it("adds url to each asset using owner/repo/tag/name", () => {
    const r = hydrateRelease("o", "r", release);
    expect(r.assets[0]).toEqual({
      name: "app-linux-x64.tar.gz",
      size: 100,
      url: "https://github.com/o/r/releases/download/v1.0.0/app-linux-x64.tar.gz",
    });
    expect(r.assets[1].url).toBe("https://github.com/o/r/releases/download/v1.0.0/app-windows.exe");
  });

  it("hydrates a list", () => {
    const list = hydrateForRender("o", "r", [release]);
    expect(list).toHaveLength(1);
    expect(list[0].assets[0].url).toContain("/releases/download/v1.0.0/");
  });
});
