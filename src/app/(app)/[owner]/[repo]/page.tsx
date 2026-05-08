import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ownerSchema, repoSchema } from "@/lib/parse-input";
import { fetchRepo } from "@/lib/github/client";
import { getReleasesPage } from "@/lib/store/releases";
import { resolveRepoRoute, type FetcherResult } from "@/lib/route/resolve-repo-route";
import type { StoredRelease } from "@/lib/store/schemas";
import { hydrateForRender, hydrateRelease } from "@/lib/build-download-url";
import { detectDeviceClassFromUserAgent, detectOsFromUserAgent } from "@/lib/detect-os";
import { ReleaseCard } from "@/components/release-card";
import { RepoHeader } from "@/components/repo-header";
import { NoReleasesState } from "@/components/error-states";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import React from "react";
import { BetaToggle } from "@/components/beta-toggle";
import { links } from "@/lib/constants/links";

const MAX_PAGE = 20;

type Params = { owner: string; repo: string };
type SearchParams = { page?: string; beta?: string };

type ReleasesData = {
  releases: StoredRelease[];
  hasMore: boolean;
  latestStable: StoredRelease | null;
};

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
  const querySuffix = buildQueryString(sp);

  const resolved = await resolveRepoRoute<ReleasesData>({
    owner,
    repo,
    fetchData: async () => {
      const result = await getReleasesPage(owner, repo, page, includeBetas);
      if (result.ok) {
        return {
          kind: "render",
          data: {
            releases: result.releases,
            hasMore: result.hasMore,
            latestStable: result.latestStable,
          },
        } satisfies FetcherResult<ReleasesData>;
      }
      return { kind: "error", error: result.error };
    },
    rebuildUrl: (o, r) => `/${o}/${r}${querySuffix}`,
  });

  if (resolved.kind === "rendered") return resolved.node;

  const { repo: repoData, data } = resolved;
  const { releases, hasMore, latestStable } = data;

  const ua = (await headers()).get("user-agent");
  const visitorOs = detectOsFromUserAgent(ua);
  const deviceClass = detectDeviceClassFromUserAgent(ua);
  const renderReleases = hydrateForRender(owner, repo, releases);
  const renderLatestStable = latestStable ? hydrateRelease(owner, repo, latestStable) : null;

  const ownerRepo = `${owner}/${repo}`;
  const heroRelease = renderLatestStable ?? renderReleases[0] ?? null;
  const jsonLd =
    heroRelease && heroRelease.assets[0]
      ? {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: repoData.name,
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
        <RepoHeader repo={repoData} />

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
        <Link
          href={`/${owner}/${repo}${page - 1 === 1 ? betaOnly : `?page=${page - 1}${beta}`}`}
          prefetch={false}
        >
          <Button variant="ghost">← Newer versions</Button>
        </Link>
      ) : (
        <span />
      )}
      <span className="text-muted-foreground">Page {page}</span>
      {hasMore && page < MAX_PAGE ? (
        <Link href={`/${owner}/${repo}?page=${page + 1}${beta}`} prefetch={false}>
          <Button variant="ghost">Older versions →</Button>
        </Link>
      ) : (
        <span />
      )}
    </nav>
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
