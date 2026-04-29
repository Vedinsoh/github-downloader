"use client"

import Link from "next/link"
import {
  classifyAsset,
  OS_LABELS,
  ARCHITECTURE_LABELS,
  type Os,
} from "@/lib/classify-asset"
import { formatBytes } from "@/lib/format"
import type { Release } from "@/lib/github/schemas"
import { Badge } from "./ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { DownloadButton } from "./download-button"
import { OtherDownloads } from "./other-downloads"
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

type Props = {
  release: Release
  owner: string
  repo: string
  visitorOs: Os
  latest?: boolean
}

export function ReleaseCard({ release, owner, repo, visitorOs, latest }: Props) {
  const enriched = release.assets
    .map((a) => ({ asset: a, info: classifyAsset(a.name) }))
    .filter((e) => !e.info.isSkippable)

  const matching = enriched.filter((e) => e.info.os === visitorOs)
  const other = enriched.filter((e) => e.info.os !== visitorOs)
  const primary = matching[0] ?? null

  const versionLabel = release.tag_name
  const releaseLink = `/${owner}/${repo}/v/${encodeURIComponent(release.tag_name)}`

  return (
    <Card className={latest ? "ring-green-500" : ""}>
      <CardHeader className="flex flex-row flex-wrap items-center gap-2">
        <div className='flex flex-1 items-center gap-2'>
          <CardTitle className="text-xl">
            <Link href={releaseLink} className="hover:underline">
              Version {versionLabel}
            </Link>
          </CardTitle>
          {release.prerelease ? <Badge variant="destructive">Beta</Badge> : null}
          {latest ? (
            <Badge variant="success">
              Latest
            </Badge>
          ) : null}
        </div>
        <div>
          {release.published_at ? (
            <span className="w-full text-xs text-muted-foreground">
              Published {dayjs(release.published_at).fromNow()}
            </span>
          ) : null}
        </div>
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
            No downloads available
          </p>
        )}

        {other.length > 0 ? (
          <OtherDownloads items={other} repo={`${owner}/${repo}`} />
        ) : null}
      </CardContent>
    </Card>
  )
}
