import { FileArchive } from "lucide-react"
import {
  getArchitectureLabel,
  getOtherDownloadsOrder,
  OS_LABELS,
  sortItemsByArch,
  type ClassifiedAsset,
  type DeviceClass,
  type Os,
} from "@/lib/classify-asset"
import { formatBytes } from "@/lib/format"
import type { ReleaseAsset } from "@/lib/github/schemas"
import { DownloadButton } from "./download-button"

type Item = { asset: ReleaseAsset; info: ClassifiedAsset }

export function OtherDownloads({
  items,
  repo,
  deviceClass,
  visitorOs,
}: {
  items: Item[]
  repo: string
  deviceClass: DeviceClass
  visitorOs: Os
}) {
  const groupedByOs = items.reduce<Record<Os, Item[]>>(
    (acc, item) => {
      acc[item.info.os].push(item)
      return acc
    },
    {
      windows: [],
      mac: [],
      linux: [],
      android: [],
      ios: [],
      unknown: [],
    }
  )

  const order = getOtherDownloadsOrder(deviceClass, visitorOs)
  const orderedGroups = order
    .map((os) => ({ os, items: sortItemsByArch(groupedByOs[os], os) }))
    .filter((group) => group.items.length > 0)

  return (
    <details className="group rounded-md border bg-muted/30 p-3 text-sm">
      <summary className="cursor-pointer list-none text-muted-foreground hover:text-foreground">
        <span className="inline-flex items-center gap-2">
          <FileArchive className="size-4" />
          Other downloads
        </span>
      </summary>
      <div className="mt-4 space-y-4">
        {orderedGroups.map((group) => (
          <section key={group.os}>
            <h4 className="mb-2 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>{OS_LABELS[group.os]}</span>
            </h4>
            <div className="space-y-2">
              {group.items.map((item) => (
                <DownloadButton
                  key={item.asset.id}
                  href={item.asset.browser_download_url}
                  os={item.info.os}
                  architectureLabel={getArchitectureLabel(item.info.os, item.info.architecture)}
                  fileName={item.asset.name}
                  fileSize={formatBytes(item.asset.size)}
                  assetName={item.asset.name}
                  repo={repo}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </details>
  )
}
