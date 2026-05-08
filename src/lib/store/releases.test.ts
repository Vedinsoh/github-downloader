import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FetchResult } from "@/lib/github/client";
import type { Release } from "@/lib/github/schemas";
import type { StoredReleaseSet } from "./schemas";

vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));

const { fetchReleasesChunkMock, fetchLatestReleaseMock, fetchReleaseByTagRawMock } = vi.hoisted(
  () => ({
    fetchReleasesChunkMock: vi.fn(),
    fetchLatestReleaseMock: vi.fn(),
    fetchReleaseByTagRawMock: vi.fn(),
  }),
);
vi.mock("@/lib/github/client", () => ({
  fetchReleasesChunk: (...args: unknown[]) => fetchReleasesChunkMock(...args),
  fetchLatestRelease: (...args: unknown[]) => fetchLatestReleaseMock(...args),
  fetchReleaseByTagRaw: (...args: unknown[]) => fetchReleaseByTagRawMock(...args),
}));

const { getJSONMock, setJSONMock, MockUnavailableError } = vi.hoisted(() => {
  class MockUnavailableError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "UnavailableError";
    }
  }
  return {
    getJSONMock: vi.fn(),
    setJSONMock: vi.fn(),
    MockUnavailableError,
  };
});

vi.mock("./kv", () => ({
  getJSON: (...args: unknown[]) => getJSONMock(...args),
  setJSON: (...args: unknown[]) => setJSONMock(...args),
  repoReleasesKey: (o: string, r: string) => `repo:${o.toLowerCase()}/${r.toLowerCase()}:releases`,
  repoTagsKey: (o: string, r: string) => `repo:${o.toLowerCase()}/${r.toLowerCase()}:tags`,
  repoCacheTag: (o: string, r: string) => `repo:${o.toLowerCase()}/${r.toLowerCase()}`,
  UnavailableError: MockUnavailableError,
}));

vi.mock("./tags-index", () => ({
  ensureTagsIndex: vi.fn(async () => ({ ok: true, index: { tags: [], complete: false, cursor: null, fetchedAt: 0 } })),
  getTagsIndex: vi.fn(async () => null),
  mergeNewTags: vi.fn((existing: unknown) => existing),
}));

import { getLatestTag } from "./releases";

function blob(releases: { tag: string; pre?: boolean }[]): StoredReleaseSet {
  return {
    chunks: 1,
    releases: releases.map((r) => ({
      tag: r.tag,
      pre: r.pre ?? false,
      date: "2026-05-01T00:00:00Z",
      assets: [],
    })),
    hasMore: false,
    fetchedAt: 1,
  };
}

function rawRelease(tag: string, prerelease = false): Release {
  return {
    id: 1,
    tag_name: tag,
    name: tag,
    prerelease,
    draft: false,
    published_at: "2026-05-01T00:00:00Z",
    html_url: `https://github.com/owner/repo/releases/tag/${tag}`,
    assets: [],
  };
}

function chunkOk(releases: Release[]): FetchResult<{ releases: Release[]; hasMore: boolean }> {
  return { ok: true, data: { releases, hasMore: false } };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getLatestTag", () => {
  it("returns latest non-pre tag from KV blob (no GitHub call)", async () => {
    getJSONMock.mockResolvedValueOnce(blob([{ tag: "v3.0.0", pre: true }, { tag: "v2.0.0" }, { tag: "v1.0.0" }]));

    const result = await getLatestTag("owner", "repo");

    expect(result).toEqual({ ok: true, tag: "v2.0.0" });
    expect(fetchReleasesChunkMock).not.toHaveBeenCalled();
    expect(fetchLatestReleaseMock).not.toHaveBeenCalled();
  });

  it("falls back to first release when every release is pre", async () => {
    getJSONMock.mockResolvedValueOnce(blob([{ tag: "v3.0.0-rc1", pre: true }, { tag: "v2.0.0-rc1", pre: true }]));

    const result = await getLatestTag("owner", "repo");

    expect(result).toEqual({ ok: true, tag: "v3.0.0-rc1" });
  });

  it("seeds blob from GitHub on KV miss, then picks latest", async () => {
    getJSONMock.mockResolvedValueOnce(null);
    fetchReleasesChunkMock.mockResolvedValueOnce(
      chunkOk([rawRelease("v2.0.0"), rawRelease("v1.0.0")]),
    );
    fetchLatestReleaseMock.mockResolvedValueOnce({ ok: true, data: rawRelease("v2.0.0") });

    const result = await getLatestTag("owner", "repo");

    expect(result).toEqual({ ok: true, tag: "v2.0.0" });
    expect(fetchReleasesChunkMock).toHaveBeenCalledWith("owner", "repo", 1);
    expect(setJSONMock).toHaveBeenCalled();
  });

  it("returns no_releases when blob has zero releases", async () => {
    getJSONMock.mockResolvedValueOnce(blob([]));

    const result = await getLatestTag("owner", "repo");

    expect(result).toEqual({ ok: false, error: { kind: "no_releases" } });
  });

  it("returns no_releases when KV miss and GitHub returns empty list", async () => {
    getJSONMock.mockResolvedValueOnce(null);
    fetchReleasesChunkMock.mockResolvedValueOnce(chunkOk([]));
    fetchLatestReleaseMock.mockResolvedValueOnce({ ok: false, error: { kind: "not_found" } });

    const result = await getLatestTag("owner", "repo");

    expect(result).toEqual({ ok: false, error: { kind: "no_releases" } });
  });

  it("propagates KV unavailable as { kind: 'unavailable' }", async () => {
    getJSONMock.mockRejectedValueOnce(new MockUnavailableError("kv down"));

    const result = await getLatestTag("owner", "repo");

    expect(result).toEqual({ ok: false, error: { kind: "unavailable" } });
  });

  it("propagates GitHub fetch errors on seed (not_found)", async () => {
    getJSONMock.mockResolvedValueOnce(null);
    fetchReleasesChunkMock.mockResolvedValueOnce({ ok: false, error: { kind: "not_found" } });

    const result = await getLatestTag("owner", "repo");

    expect(result).toEqual({ ok: false, error: { kind: "not_found" } });
  });

  it("propagates GitHub fetch errors on seed (rate_limited)", async () => {
    getJSONMock.mockResolvedValueOnce(null);
    fetchReleasesChunkMock.mockResolvedValueOnce({ ok: false, error: { kind: "rate_limited" } });
    fetchLatestReleaseMock.mockResolvedValueOnce({ ok: false, error: { kind: "rate_limited" } });

    const result = await getLatestTag("owner", "repo");

    expect(result).toEqual({ ok: false, error: { kind: "rate_limited" } });
  });
});
