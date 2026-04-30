"use client"

import {
  ARCHITECTURE_LABELS,
  classifyRelease,
  OS_LABELS,
  type DeviceClass,
  type Os,
} from "@/lib/classify-asset"
import { formatBytes } from "@/lib/format"
import type { ReleaseAsset } from "@/lib/github/schemas"
import { DownloadButton } from "./download-button"
import { OtherDownloads } from "./other-downloads"

type Props = {
  assets: ReleaseAsset[]
  visitorOs: Os
  deviceClass: DeviceClass
  repo: string
}

export function ReleaseAssets({ assets, visitorOs, deviceClass, repo }: Props) {
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

  const { primary, sameOsSiblings, others } = classified

  return (
    <div className="space-y-6">
      {primary ? (
        <div className="space-y-3">
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
          {sameOsSiblings.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Also available:
              </span>
              {sameOsSiblings.map(({ asset, info }) => (
                <DownloadButton
                  key={asset.id}
                  href={asset.browser_download_url}
                  os={info.os}
                  architectureLabel={ARCHITECTURE_LABELS[info.architecture]}
                  fileName={asset.name}
                  fileSize={formatBytes(asset.size)}
                  assetName={asset.name}
                  repo={repo}
                  sibling
                  mode="os-build"
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          No download for {OS_LABELS[visitorOs]} in this version. See other
          systems below.
        </p>
      )}

      {others.length > 0 ? (
        <OtherDownloads
          items={others}
          repo={repo}
          deviceClass={deviceClass}
          visitorOs={visitorOs}
        />
      ) : null}
    </div>
  )
}
