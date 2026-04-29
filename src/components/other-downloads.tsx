"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import {
  ARCHITECTURE_LABELS,
  OS_LABELS,
  type ClassifiedAsset,
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
  const [open, setOpen] = useState(false)

  const grouped = items.reduce<Record<string, Item[]>>((acc, item) => {
    const key = OS_LABELS[item.info.os]
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-medium hover:underline"
      >
        <span>Show downloads for other systems</span>
        <ChevronDown
          className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="mt-4 space-y-4">
          {Object.entries(grouped).map(([osLabel, group]) => (
            <div key={osLabel}>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {osLabel}
              </h4>
              <div className="space-y-2">
                {group.map((item) => (
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
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
