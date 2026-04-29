import Link from "next/link"
import {
  classifyAsset,
  OS_LABELS,
  ARCHITECTURE_LABELS,
  type Os,
} from "@/lib/classify-asset"
import { formatBytes, formatDate } from "@/lib/format"
import type { Release } from "@/lib/github/schemas"
import { Badge } from "./ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { DownloadButton } from "./download-button"
import { OtherDownloads } from "./other-downloads"
import { SourceCodeSection } from "./source-code-section"

type Props = {
  release: Release
  owner: string
  repo: string
  visitorOs: Os
  isPinned?: boolean
}

export function ReleaseCard({ release, owner, repo, visitorOs, isPinned }: Props) {
  const enriched = release.assets
    .map((a) => ({ asset: a, info: classifyAsset(a.name) }))
    .filter((e) => !e.info.isSkippable)

  const matching = enriched.filter((e) => e.info.os === visitorOs)
  const other = enriched.filter((e) => e.info.os !== visitorOs)
  const primary = matching[0] ?? null

  const versionLabel = release.tag_name

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center gap-2">
        <CardTitle className="flex-1 text-xl">Version {versionLabel}</CardTitle>
        {release.prerelease ? <Badge variant="secondary">Beta</Badge> : null}
        {!isPinned ? (
          <Link
            href={`/${owner}/${repo}/v/${encodeURIComponent(release.tag_name)}`}
            className="text-xs text-muted-foreground hover:underline"
          >
            Copy share link
          </Link>
        ) : null}
        {release.published_at ? (
          <span className="w-full text-xs text-muted-foreground">
            Published {formatDate(release.published_at)}
          </span>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-6">
        {primary ? (
          <DownloadButton
            href={primary.asset.browser_download_url}
            os={primary.info.os}
            architectureLabel={ARCHITECTURE_LABELS[primary.info.architecture]}
            fileName={primary.asset.name}
            fileSize={formatBytes(primary.asset.size)}
            assetName={primary.asset.name}
            repo={`${owner}/${repo}`}
            primary
          />
        ) : enriched.length > 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            No download for {OS_LABELS[visitorOs]} in this version. See other
            systems below.
          </p>
        ) : (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            This version is provided as source code only — you may need a
            developer to use it.
          </p>
        )}

        {other.length > 0 ? (
          <OtherDownloads items={other} repo={`${owner}/${repo}`} />
        ) : null}

        <SourceCodeSection
          tarball={release.tarball_url}
          zipball={release.zipball_url}
          tag={release.tag_name}
          repo={`${owner}/${repo}`}
        />
      </CardContent>
    </Card>
  )
}
