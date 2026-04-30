import { FileArchive } from "lucide-react"
import {
  ARCHITECTURE_LABELS,
  OS_LABELS,
  PREFERRED_OS_ORDER,
  type ClassifiedAsset,
  type Os,
} from "@/lib/classify-asset"
import { formatBytes } from "@/lib/format"
import type { ReleaseAsset } from "@/lib/github/schemas"
import { DownloadButton } from "./download-button"

type Item = { asset: ReleaseAsset; info: ClassifiedAsset }

export function OtherDownloads({
  items,
  repo,
}: {
  items: Item[]
  repo: string
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

  const orderedGroups = PREFERRED_OS_ORDER
    .map((os) => ({ os, items: groupedByOs[os] }))
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
        {orderedGroups.map((group) => {

          return (
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
                    architectureLabel={ARCHITECTURE_LABELS[item.info.architecture]}
                    fileName={item.asset.name}
                    fileSize={formatBytes(item.asset.size)}
                    assetName={item.asset.name}
                    repo={repo}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </details>
  )
}
