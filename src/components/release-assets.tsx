"use client"

import {
  ARCHITECTURE_LABELS,
  classifyRelease,
  OS_LABELS,
  type Os,
} from "@/lib/classify-asset"
import { formatBytes } from "@/lib/format"
import type { ReleaseAsset } from "@/lib/github/schemas"
import { DownloadButton } from "./download-button"
import { OtherDownloads } from "./other-downloads"

type Props = {
  assets: ReleaseAsset[]
  visitorOs: Os
  repo: string
}

export function ReleaseAssets({ assets, visitorOs, repo }: Props) {
  const classified = classifyRelease(assets, visitorOs)

  if (classified.mode === "empty") {
    return (
      <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        No downloads available
      </p>
    )
  }

  if (classified.mode === "archive-primary") {
    return (
      <div className="space-y-2">
        {classified.archives.map(({ asset, info }) => (
          <DownloadButton
            key={asset.id}
            href={asset.browser_download_url}
            os={info.os}
            architectureLabel={ARCHITECTURE_LABELS[info.architecture]}
            fileName={asset.name}
            fileSize={formatBytes(asset.size)}
            assetName={asset.name}
            repo={repo}
            mode="archive-primary"
          />
        ))}
      </div>
    )
  }

  const { primary, others } = classified

  return (
    <div className="space-y-6">
      {primary ? (
        <DownloadButton
          href={primary.asset.browser_download_url}
          os={primary.info.os}
          architectureLabel={ARCHITECTURE_LABELS[primary.info.architecture]}
          fileName={primary.asset.name}
          fileSize={formatBytes(primary.asset.size)}
          assetName={primary.asset.name}
          repo={repo}
          primary
          mode="os-build"
        />
      ) : (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          No download for {OS_LABELS[visitorOs]} in this version. See other
          systems below.
        </p>
      )}

      {others.length > 0 ? <OtherDownloads items={others} repo={repo} /> : null}
    </div>
  )
}
