import { describe, expect, it, vi, beforeEach } from "vitest";
import { createElement, type ReactElement, type ReactNode } from "react";
import type { Repo } from "@/lib/github/schemas";
import type { FetchResult } from "@/lib/github/client";
import {
  BusyState,
  NotFoundState,
  TemporarilyUnavailableState,
} from "@/components/error-states";
import { RepoHeader } from "@/components/repo-header";

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

const { fetchRepoMock } = vi.hoisted(() => ({ fetchRepoMock: vi.fn() }));
vi.mock("@/lib/github/client", () => ({
  fetchRepo: (...args: unknown[]) => fetchRepoMock(...args),
}));

import { resolveRepoRoute, type FetcherResult } from "./resolve-repo-route";

function makeRepo(overrides: Partial<Repo> = {}): Repo {
  return {
    name: "repo",
    description: null,
    archived: false,
    html_url: "https://github.com/owner/repo",
    owner: {
      login: "owner",
      avatar_url: "https://avatars.example/owner",
      html_url: "https://github.com/owner",
    },
    ...overrides,
  } as Repo;
}

function repoOk(repo: Repo): FetchResult<Repo> {
  return { ok: true, data: repo };
}

function repoErr(error: { kind: string; [k: string]: unknown }): FetchResult<Repo> {
  return { ok: false, error: error as never };
}

function flatten(node: ReactNode): ReactElement[] {
  const out: ReactElement[] = [];
  const visit = (n: ReactNode) => {
    if (n === null || n === undefined || typeof n === "boolean") return;
    if (typeof n === "string" || typeof n === "number") return;
    if (Array.isArray(n)) {
      n.forEach(visit);
      return;
    }
    if (typeof n === "object" && "type" in n) {
      const el = n as ReactElement;
      out.push(el);
      const props = el.props as { children?: ReactNode };
      if (props && props.children) visit(props.children);
    }
  };
  visit(node);
  return out;
}

function findByType(node: ReactNode, type: unknown): ReactElement | undefined {
  return flatten(node).find((el) => el.type === type);
}

const rebuildUrl = (o: string, r: string) => `/${o}/${r}`;
const rebuildUrlWithSuffix = (suffix: string) => (o: string, r: string) => `/${o}/${r}${suffix}`;

const renderFetcher =
  <T>(data: T) =>
  async (): Promise<FetcherResult<T>> => ({ kind: "render", data });

beforeEach(() => {
  fetchRepoMock.mockReset();
});

describe("resolveRepoRoute", () => {
  it("returns ok when both fetchRepo and fetcher succeed", async () => {
    fetchRepoMock.mockResolvedValue(repoOk(makeRepo()));
    const result = await resolveRepoRoute<string>({
      owner: "owner",
      repo: "repo",
      fetchData: async () => ({ kind: "render", data: "data!" }),
      rebuildUrl,
    });
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") throw new Error("expected ok");
    expect(result.data).toBe("data!");
    expect(result.repo.name).toBe("repo");
  });

  it("redirects to fetcher.to on kind=redirect", async () => {
    fetchRepoMock.mockResolvedValue(repoOk(makeRepo()));
    await expect(
      resolveRepoRoute<string>({
        owner: "owner",
        repo: "repo",
        fetchData: async () => ({ kind: "redirect", to: "/owner/repo/v/v1.0.0" }),
        rebuildUrl,
      }),
    ).rejects.toThrow("REDIRECT:/owner/repo/v/v1.0.0");
  });

  it("redirects via rebuildUrl on fetchRepo moved", async () => {
    fetchRepoMock.mockResolvedValue(
      repoErr({ kind: "moved", owner: "newowner", repo: "newrepo" }),
    );
    await expect(
      resolveRepoRoute<string>({
        owner: "owner",
        repo: "repo",
        fetchData: renderFetcher("ignored"),
        rebuildUrl: rebuildUrlWithSuffix("?page=2"),
      }),
    ).rejects.toThrow("REDIRECT:/newowner/newrepo?page=2");
  });

  it("redirects via rebuildUrl on fetcher moved when fetchRepo ok", async () => {
    fetchRepoMock.mockResolvedValue(repoOk(makeRepo()));
    await expect(
      resolveRepoRoute<string>({
        owner: "owner",
        repo: "repo",
        fetchData: async () => ({
          kind: "error",
          error: { kind: "moved", owner: "newowner", repo: "newrepo" },
        }),
        rebuildUrl,
      }),
    ).rejects.toThrow("REDIRECT:/newowner/newrepo");
  });

  it("fetchRepo's moved wins when both signal moved with disagreeing canonicals", async () => {
    fetchRepoMock.mockResolvedValue(
      repoErr({ kind: "moved", owner: "fromrepo", repo: "fromrepo" }),
    );
    await expect(
      resolveRepoRoute<string>({
        owner: "owner",
        repo: "repo",
        fetchData: async () => ({
          kind: "error",
          error: { kind: "moved", owner: "fromdata", repo: "fromdata" },
        }),
        rebuildUrl,
      }),
    ).rejects.toThrow("REDIRECT:/fromrepo/fromrepo");
  });

  it("redirects on case-only mismatch between raw and canonical", async () => {
    fetchRepoMock.mockResolvedValue(
      repoOk(
        makeRepo({
          name: "Repo",
          owner: {
            login: "Owner",
            avatar_url: "x",
            html_url: "x",
          } as Repo["owner"],
        }),
      ),
    );
    await expect(
      resolveRepoRoute<string>({
        owner: "owner",
        repo: "repo",
        fetchData: renderFetcher("x"),
        rebuildUrl,
      }),
    ).rejects.toThrow("REDIRECT:/Owner/Repo");
  });

  it("renders NotFoundState without RepoHeader when fetchRepo not_found", async () => {
    fetchRepoMock.mockResolvedValue(repoErr({ kind: "not_found" }));
    const result = await resolveRepoRoute<string>({
      owner: "owner",
      repo: "repo",
      fetchData: renderFetcher("x"),
      rebuildUrl,
    });
    if (result.kind !== "rendered") throw new Error("expected rendered");
    expect(findByType(result.node, NotFoundState)).toBeDefined();
    expect(findByType(result.node, RepoHeader)).toBeUndefined();
  });

  it("renders BusyState without RepoHeader when fetchRepo rate_limited", async () => {
    fetchRepoMock.mockResolvedValue(repoErr({ kind: "rate_limited" }));
    const result = await resolveRepoRoute<string>({
      owner: "owner",
      repo: "repo",
      fetchData: renderFetcher("x"),
      rebuildUrl,
    });
    if (result.kind !== "rendered") throw new Error("expected rendered");
    expect(findByType(result.node, BusyState)).toBeDefined();
    expect(findByType(result.node, RepoHeader)).toBeUndefined();
  });

  it("renders BusyState without RepoHeader on upstream/schema_drift", async () => {
    fetchRepoMock.mockResolvedValueOnce(repoErr({ kind: "upstream", status: 500 }));
    const r1 = await resolveRepoRoute<string>({
      owner: "owner",
      repo: "repo",
      fetchData: renderFetcher("x"),
      rebuildUrl,
    });
    if (r1.kind !== "rendered") throw new Error("expected rendered");
    expect(findByType(r1.node, BusyState)).toBeDefined();
    expect(findByType(r1.node, RepoHeader)).toBeUndefined();

    fetchRepoMock.mockResolvedValueOnce(repoErr({ kind: "schema_drift", issues: [] }));
    const r2 = await resolveRepoRoute<string>({
      owner: "owner",
      repo: "repo",
      fetchData: renderFetcher("x"),
      rebuildUrl,
    });
    if (r2.kind !== "rendered") throw new Error("expected rendered");
    expect(findByType(r2.node, BusyState)).toBeDefined();
  });

  it("renders notFoundNode + RepoHeader when fetcher not_found and node provided", async () => {
    fetchRepoMock.mockResolvedValue(repoOk(makeRepo()));
    const Marker = () => null;
    const result = await resolveRepoRoute<string>({
      owner: "owner",
      repo: "repo",
      fetchData: async () => ({ kind: "error", error: { kind: "not_found" } }),
      rebuildUrl,
      notFoundNode: createElement(Marker),
    });
    if (result.kind !== "rendered") throw new Error("expected rendered");
    expect(findByType(result.node, Marker)).toBeDefined();
    expect(findByType(result.node, RepoHeader)).toBeDefined();
  });

  it("falls back to BusyState when fetcher not_found and no notFoundNode", async () => {
    fetchRepoMock.mockResolvedValue(repoOk(makeRepo()));
    const result = await resolveRepoRoute<string>({
      owner: "owner",
      repo: "repo",
      fetchData: async () => ({ kind: "error", error: { kind: "not_found" } }),
      rebuildUrl,
    });
    if (result.kind !== "rendered") throw new Error("expected rendered");
    expect(findByType(result.node, BusyState)).toBeDefined();
    expect(findByType(result.node, RepoHeader)).toBeDefined();
  });

  it("renders TemporarilyUnavailableState + RepoHeader on fetcher unavailable", async () => {
    fetchRepoMock.mockResolvedValue(repoOk(makeRepo()));
    const result = await resolveRepoRoute<string>({
      owner: "owner",
      repo: "repo",
      fetchData: async () => ({ kind: "error", error: { kind: "unavailable" } }),
      rebuildUrl,
    });
    if (result.kind !== "rendered") throw new Error("expected rendered");
    expect(findByType(result.node, TemporarilyUnavailableState)).toBeDefined();
    expect(findByType(result.node, RepoHeader)).toBeDefined();
  });

  it("runs fetchRepo and fetcher concurrently", async () => {
    let fetchRepoStartedAt = 0;
    let fetcherStartedAt = 0;
    fetchRepoMock.mockImplementation(async () => {
      fetchRepoStartedAt = Date.now();
      await new Promise((r) => setTimeout(r, 30));
      return repoOk(makeRepo());
    });
    const fetcher = async (): Promise<FetcherResult<string>> => {
      fetcherStartedAt = Date.now();
      await new Promise((r) => setTimeout(r, 30));
      return { kind: "render", data: "x" };
    };
    const t0 = Date.now();
    await resolveRepoRoute<string>({
      owner: "owner",
      repo: "repo",
      fetchData: fetcher,
      rebuildUrl,
    });
    const total = Date.now() - t0;
    expect(Math.abs(fetchRepoStartedAt - fetcherStartedAt)).toBeLessThan(20);
    expect(total).toBeLessThan(55);
  });
});
