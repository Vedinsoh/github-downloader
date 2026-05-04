import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ownerSchema, repoSchema } from "@/lib/parse-input";
import { fetchRepo } from "@/lib/github/client";
import { getReleasesPage } from "@/lib/store/releases";
import { hydrateForRender, hydrateRelease } from "@/lib/build-download-url";
import { detectDeviceClassFromUserAgent, detectOsFromUserAgent } from "@/lib/detect-os";
import { ReleaseCard } from "@/components/release-card";
import { RepoHeader } from "@/components/repo-header";
import {
  BusyState,
  NoReleasesState,
  NotFoundState,
  TemporarilyUnavailableState,
} from "@/components/error-states";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import React from "react";
import { BetaToggle } from "@/components/beta-toggle";
import { links } from "@/lib/constants/links";

const MAX_PAGE = 100;

type Params = { owner: string; repo: string };
type SearchParams = { page?: string; beta?: string };

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { owner, repo } = await params;
  const sp = await searchParams;
  const includeBetas = sp.beta === "show";

  if (!ownerSchema.safeParse(owner).success || !repoSchema.safeParse(repo).success) {
    return { title: "Not found" };
  }
  const r = await fetchRepo(owner, repo);
  const canonical = `${links.app.url}/${owner}/${repo}`;
  if (!r.ok) {
    return {
      title: `${owner}/${repo}`,
      alternates: { canonical },
      robots: { index: false },
    };
  }
  const desc =
    r.data.description ?? `Download the latest version of ${r.data.name} by ${r.data.owner.login}.`;
  return {
    title: `Download ${r.data.name} by ${r.data.owner.login}`,
    description:
      `Download the latest version of ${r.data.name} by ${r.data.owner.login}. ${desc}`.slice(
        0,
        160,
      ),
    alternates: { canonical },
    ...(includeBetas ? { robots: { index: false } } : {}),
    openGraph: {
      title: `Download ${r.data.name} – ${r.data.owner.login}`,
      description: desc,
      url: canonical,
      images: [
        {
          url: `/og?owner=${owner}&repo=${repo}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default async function RepoPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { owner, repo } = await params;
  const sp = await searchParams;

  if (!ownerSchema.safeParse(owner).success || !repoSchema.safeParse(repo).success) {
    notFound();
  }

  const page = clampPage(sp.page);
  if (page === null) notFound();

  const includeBetas = sp.beta === "show";

  const repoResult = await fetchRepo(owner, repo);
  if (!repoResult.ok) {
    if (repoResult.error.kind === "moved") {
      redirect(`/${repoResult.error.owner}/${repoResult.error.repo}`);
    }
    return renderError(owner, repo, repoResult.error.kind);
  }

  const canonicalOwner = repoResult.data.owner.login;
  const canonicalRepo = repoResult.data.name;
  if (
    (owner !== canonicalOwner && owner.toLowerCase() === canonicalOwner.toLowerCase()) ||
    (repo !== canonicalRepo && repo.toLowerCase() === canonicalRepo.toLowerCase())
  ) {
    const qs = buildQueryString(sp);
    redirect(`/${canonicalOwner}/${canonicalRepo}${qs}`);
  }

  const releasesResult = await getReleasesPage(owner, repo, page, includeBetas);
  if (!releasesResult.ok) {
    if (releasesResult.error.kind === "moved") {
      redirect(`/${releasesResult.error.owner}/${releasesResult.error.repo}`);
    }
    return renderError(owner, repo, releasesResult.error.kind);
  }

  const ua = (await headers()).get("user-agent");
  const visitorOs = detectOsFromUserAgent(ua);
  const deviceClass = detectDeviceClassFromUserAgent(ua);
  const { releases, hasMore, latestStable } = releasesResult;
  const renderReleases = hydrateForRender(owner, repo, releases);
  const renderLatestStable = latestStable ? hydrateRelease(owner, repo, latestStable) : null;

  const ownerRepo = `${owner}/${repo}`;
  const heroRelease = renderLatestStable ?? renderReleases[0] ?? null;
  const jsonLd =
    heroRelease && heroRelease.assets[0]
      ? {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: repoResult.data.name,
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Windows, macOS, Linux",
          softwareVersion: heroRelease.tag,
          downloadUrl: heroRelease.assets[0].url,
          url: `${links.app.url}/${ownerRepo}`,
        }
      : null;

  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-6 py-10">
        <RepoHeader repo={repoResult.data} />

        <BetaToggle />

        {renderReleases.length === 0 && page === 1 ? (
          <NoReleasesState />
        ) : (
          <>
            <section className="space-y-8">
              {renderReleases.map((release, i) => (
                <React.Fragment key={release.tag}>
                  <ReleaseCard
                    release={release}
                    owner={owner}
                    repo={repo}
                    visitorOs={visitorOs}
                    deviceClass={deviceClass}
                    latest={
                      page === 1 &&
                      renderLatestStable !== null &&
                      release.tag === renderLatestStable.tag
                    }
                  />

                  {i === 0 && page === 1 && renderReleases.length > 1 && (
                    <hr className="border-muted-foreground/10 border-t" />
                  )}
                </React.Fragment>
              ))}
            </section>

            <Pagination
              owner={owner}
              repo={repo}
              page={page}
              hasMore={hasMore}
              includeBetas={includeBetas}
            />
          </>
        )}

        {jsonLd ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}

function Pagination({
  owner,
  repo,
  page,
  hasMore,
  includeBetas,
}: {
  owner: string;
  repo: string;
  page: number;
  hasMore: boolean;
  includeBetas: boolean;
}) {
  if (page === 1 && !hasMore) return null;
  const beta = includeBetas ? "&beta=show" : "";
  const betaOnly = includeBetas ? "?beta=show" : "";
  return (
    <nav className="flex items-center justify-between border-t pt-6 text-sm">
      {page > 1 ? (
        <Link href={`/${owner}/${repo}${page - 1 === 1 ? betaOnly : `?page=${page - 1}${beta}`}`}>
          <Button variant="ghost">← Newer versions</Button>
        </Link>
      ) : (
        <span />
      )}
      <span className="text-muted-foreground">Page {page}</span>
      {hasMore && page < MAX_PAGE ? (
        <Link href={`/${owner}/${repo}?page=${page + 1}${beta}`}>
          <Button variant="ghost">Older versions →</Button>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

function renderError(owner: string, repo: string, kind: string) {
  let main: React.ReactNode;
  if (kind === "not_found") {
    main = <NotFoundState message={`We couldn't find a repository called "${owner}/${repo}".`} />;
  } else if (kind === "unavailable") {
    main = <TemporarilyUnavailableState />;
  } else {
    main = <BusyState />;
  }
  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">{main}</main>
      <SiteFooter />
    </>
  );
}

function clampPage(raw: string | undefined): number | null {
  if (!raw) return 1;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > MAX_PAGE) return null;
  return n;
}

function buildQueryString(sp: SearchParams): string {
  const params = new URLSearchParams();
  if (sp.page) params.set("page", sp.page);
  if (sp.beta) params.set("beta", sp.beta);
  const s = params.toString();
  return s ? `?${s}` : "";
}
