import { describe, expect, it } from "vitest";
import { toStored } from "./to-stored";
import type { Release, ReleaseAsset } from "@/lib/github/schemas";

function asset(overrides: Partial<ReleaseAsset> = {}): ReleaseAsset {
  return {
    id: 1,
    name: "app-linux-x64.tar.gz",
    size: 1024,
    download_count: 0,
    browser_download_url: "https://example.com/app-linux-x64.tar.gz",
    ...overrides,
  };
}

function release(overrides: Partial<Release> = {}): Release {
  return {
    id: 100,
    tag_name: "v1.0.0",
    name: "Release 1",
    draft: false,
    prerelease: false,
    published_at: "2026-01-01T00:00:00Z",
    html_url: "https://github.com/x/y/releases/tag/v1.0.0",
    assets: [asset()],
    ...overrides,
  };
}

describe("toStored", () => {
  it("strips name/html_url/id from release and renames fields", () => {
    const r = toStored(release());
    expect(r).toEqual({
      tag: "v1.0.0",
      pre: false,
      date: "2026-01-01T00:00:00Z",
      assets: [
        {
          name: "app-linux-x64.tar.gz",
          size: 1024,
        },
      ],
    });
  });

  it("strips id/download_count/content_type from assets", () => {
    const r = toStored(
      release({
        assets: [asset({ id: 999, download_count: 42, content_type: "application/x-gzip" })],
      }),
    );
    expect(r.assets[0]).toEqual({
      name: "app-linux-x64.tar.gz",
      size: 1024,
    });
  });

  it("filters out skippable assets (signatures, checksums)", () => {
    const r = toStored(
      release({
        assets: [
          asset({ name: "app-linux-x64.tar.gz" }),
          asset({ id: 2, name: "app-linux-x64.tar.gz.sig" }),
          asset({ id: 3, name: "checksums.txt" }),
        ],
      }),
    );
    expect(r.assets).toHaveLength(1);
    expect(r.assets[0].name).toBe("app-linux-x64.tar.gz");
  });

  it("filters out .aab assets", () => {
    const r = toStored(release({ assets: [asset({ name: "app-release.aab" })] }));
    expect(r.assets).toEqual([]);
  });

  it("empty assets list yields empty stored assets", () => {
    const r = toStored(release({ assets: [] }));
    expect(r.assets).toEqual([]);
  });

  it("all-skippable assets yields empty stored assets", () => {
    const r = toStored(
      release({
        assets: [asset({ name: "release.sig" }), asset({ id: 2, name: "checksums.txt" })],
      }),
    );
    expect(r.assets).toEqual([]);
  });

  it("preserves prerelease and null published_at", () => {
    const r = toStored(release({ prerelease: true, published_at: null }));
    expect(r.pre).toBe(true);
    expect(r.date).toBeNull();
  });
});
