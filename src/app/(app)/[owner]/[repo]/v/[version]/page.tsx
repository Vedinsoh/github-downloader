import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { ownerSchema, repoSchema, versionSchema } from "@/lib/parse-input";
import { fetchRepo } from "@/lib/github/client";
import { getReleaseByTag } from "@/lib/store/releases";
import { hydrateRelease } from "@/lib/build-download-url";
import { detectDeviceClassFromUserAgent, detectOsFromUserAgent } from "@/lib/detect-os";
import { ReleaseCard } from "@/components/release-card";
import { RepoHeader } from "@/components/repo-header";
import {
  BusyState,
  NotFoundState,
  TemporarilyUnavailableState,
  VersionNotFoundState,
} from "@/components/error-states";
import { SiteFooter } from "@/components/site-footer";
import { links } from "@/lib/constants/links";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Params = { owner: string; repo: string; version: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { owner, repo, version } = await params;
  const tag = decodeVersion(version);
  return {
    title: `${owner}/${repo}${tag ? ` · ${tag}` : ""}`,
    alternates: { canonical: `${links.app.url}/${owner}/${repo}/v/${version}` },
    robots: { index: false },
  };
}

export default async function VersionPage({ params }: { params: Promise<Params> }) {
  const { owner, repo, version } = await params;

  if (!ownerSchema.safeParse(owner).success || !repoSchema.safeParse(repo).success) {
    notFound();
  }

  const tag = decodeVersion(version);
  if (!tag || !versionSchema.safeParse(tag).success) notFound();

  const repoResult = await fetchRepo(owner, repo);
  if (!repoResult.ok) {
    if (repoResult.error.kind === "moved") {
      redirect(`/${repoResult.error.owner}/${repoResult.error.repo}/v/${version}`);
    }
    return renderError(owner, repo, repoResult.error.kind);
  }

  const releaseResult = await getReleaseByTag(owner, repo, tag);
  if (!releaseResult.ok) {
    const ownerRepo = `${owner}/${repo}`;
    if (releaseResult.error.kind === "not_found") {
      return (
        <>
          <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-6 py-10">
            <RepoHeader repo={repoResult.data} />
            <VersionNotFoundState ownerRepo={ownerRepo} />
          </main>
          <SiteFooter />
        </>
      );
    }
    if (releaseResult.error.kind === "moved") {
      redirect(`/${releaseResult.error.owner}/${releaseResult.error.repo}/v/${version}`);
    }
    return renderError(owner, repo, releaseResult.error.kind);
  }

  const ua = (await headers()).get("user-agent");
  const visitorOs = detectOsFromUserAgent(ua);
  const deviceClass = detectDeviceClassFromUserAgent(ua);

  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-6 py-10">
        <RepoHeader repo={repoResult.data} />
        <ReleaseCard
          release={hydrateRelease(owner, repo, releaseResult.release)}
          owner={owner}
          repo={repo}
          visitorOs={visitorOs}
          deviceClass={deviceClass}
        />
        <Link href={`/${owner}/${repo}`} className="flex justify-center">
          <Button variant="outline" size="lg">
            See all versions
          </Button>
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}

function renderError(owner: string, repo: string, kind: string) {
  let body: React.ReactNode;
  if (kind === "not_found") {
    body = <NotFoundState message={`We couldn't find a repository called "${owner}/${repo}".`} />;
  } else if (kind === "unavailable") {
    body = <TemporarilyUnavailableState />;
  } else {
    body = <BusyState />;
  }
  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">{body}</main>
      <SiteFooter />
    </>
  );
}

function decodeVersion(raw: string): string | null {
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}
