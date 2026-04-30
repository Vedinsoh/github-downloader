"use client"

import Link from "next/link"
import { type DeviceClass, type Os } from "@/lib/classify-asset"
import type { Release } from "@/lib/github/schemas"
import { Badge } from "./ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { ReleaseAssets } from "./release-assets"
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

type Props = {
  release: Release
  owner: string
  repo: string
  visitorOs: Os
  deviceClass: DeviceClass
  latest?: boolean
}

export function ReleaseCard({ release, owner, repo, visitorOs, deviceClass, latest }: Props) {
  const versionLabel = release.tag_name
  const releaseLink = `/${owner}/${repo}/v/${encodeURIComponent(release.tag_name)}`

  let cardClass = ""
  switch (true) {
    case latest:
      cardClass = "ring-green-500"
      break
    case release.prerelease:
      cardClass = "ring-yellow-900 bg-opaque/10"
      break
  }

  return (
    <Card className={cardClass}>
      <CardHeader className="flex flex-row flex-wrap items-center gap-2">
        <div className='flex flex-1 items-center gap-2'>
          <CardTitle className="text-xl">
            <Link href={releaseLink} className="hover:underline">
              Version {versionLabel}
            </Link>
          </CardTitle>
          {release.prerelease ? <Badge variant="destructive">Beta</Badge> : null}
          {latest ? (<Badge variant="success">Latest</Badge>) : null}
        </div>
        <div>
          {release.published_at ? (
            <span className="w-full text-xs text-muted-foreground">
              {dayjs(release.published_at).fromNow()}
            </span>
          ) : null}
        </div>
      </CardHeader>

      <CardContent>
        <ReleaseAssets
          assets={release.assets}
          visitorOs={visitorOs}
          deviceClass={deviceClass}
          repo={`${owner}/${repo}`}
        />
      </CardContent>
    </Card>
  )
}
