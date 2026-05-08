import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import type { FetchError } from "@/lib/github/client";
import { fetchRepo } from "@/lib/github/client";
import type { Repo } from "@/lib/github/schemas";
import {
  BusyState,
  NotFoundState,
  TemporarilyUnavailableState,
} from "@/components/error-states";
import { RepoHeader } from "@/components/repo-header";
import { SiteFooter } from "@/components/site-footer";

export type FetcherError = FetchError | { kind: "unavailable" };

export type FetcherResult<T> =
  | { kind: "render"; data: T }
  | { kind: "redirect"; to: string }
  | { kind: "error"; error: FetcherError };

export type ResolveRepoRouteParams<T> = {
  owner: string;
  repo: string;
  fetchData: () => Promise<FetcherResult<T>>;
  rebuildUrl: (canonicalOwner: string, canonicalRepo: string) => string;
  notFoundNode?: ReactNode;
};

export type ResolveRepoRouteResult<T> =
  | { kind: "ok"; repo: Repo; data: T }
  | { kind: "rendered"; node: ReactNode };

export async function resolveRepoRoute<T>(
  params: ResolveRepoRouteParams<T>,
): Promise<ResolveRepoRouteResult<T>> {
  const { owner, repo, fetchData, rebuildUrl, notFoundNode } = params;

  const [repoResult, dataResult] = await Promise.all([fetchRepo(owner, repo), fetchData()]);

  if (!repoResult.ok && repoResult.error.kind === "moved") {
    redirect(rebuildUrl(repoResult.error.owner, repoResult.error.repo));
  }

  if (dataResult.kind === "error" && dataResult.error.kind === "moved") {
    redirect(rebuildUrl(dataResult.error.owner, dataResult.error.repo));
  }

  if (!repoResult.ok) {
    return { kind: "rendered", node: renderRepoError(owner, repo, repoResult.error) };
  }

  const canonicalOwner = repoResult.data.owner.login;
  const canonicalRepo = repoResult.data.name;
  if (
    (owner !== canonicalOwner && owner.toLowerCase() === canonicalOwner.toLowerCase()) ||
    (repo !== canonicalRepo && repo.toLowerCase() === canonicalRepo.toLowerCase())
  ) {
    redirect(rebuildUrl(canonicalOwner, canonicalRepo));
  }

  if (dataResult.kind === "redirect") {
    redirect(dataResult.to);
  }

  if (dataResult.kind === "error") {
    return {
      kind: "rendered",
      node: renderDataError(repoResult.data, dataResult.error, notFoundNode),
    };
  }

  return { kind: "ok", repo: repoResult.data, data: dataResult.data };
}

function renderRepoError(owner: string, repo: string, error: FetchError): ReactNode {
  const inner =
    error.kind === "not_found" ? (
      <NotFoundState message={`We couldn't find a repository called "${owner}/${repo}".`} />
    ) : (
      <BusyState />
    );
  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">{inner}</main>
      <SiteFooter />
    </>
  );
}

function renderDataError(
  repo: Repo,
  error: FetcherError,
  notFoundNode: ReactNode,
): ReactNode {
  let inner: ReactNode;
  if (error.kind === "not_found") {
    inner = notFoundNode ?? <BusyState />;
  } else if (error.kind === "unavailable") {
    inner = <TemporarilyUnavailableState />;
  } else {
    // moved is redirected by the caller; the rest map to BusyState.
    inner = <BusyState />;
  }
  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-6 py-10">
        <RepoHeader repo={repo} />
        {inner}
      </main>
      <SiteFooter />
    </>
  );
}
