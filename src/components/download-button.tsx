"use client"

import { track } from "@vercel/analytics"
import { Download } from "lucide-react"
import { Button } from "./ui/button"
import { OS_LABELS, type Os } from "@/lib/classify-asset"

type Props = {
  href: string
  os: Os
  architectureLabel: string
  fileName: string
  fileSize: string
  assetName: string
  repo: string
  primary?: boolean
  isSource?: boolean
}

export function DownloadButton({
  href,
  os,
  architectureLabel,
  fileName,
  fileSize,
  assetName,
  repo,
  primary,
  isSource,
}: Props) {
  function onClick() {
    track("download_click", {
      repo,
      asset_name: assetName,
      os,
      is_source: Boolean(isSource),
    })
  }

  if (primary) {
    return (
      <a href={href} onClick={onClick} className="block">
        <Button className="h-14 w-full bg-blue-600 text-base text-white hover:bg-blue-700">
          <Download className="mr-2 size-5" />
          <span>
            Download for {OS_LABELS[os]}
            {architectureLabel ? ` (${architectureLabel})` : ""}
          </span>
        </Button>
        <span className="mt-2 block text-xs text-muted-foreground">
          {fileName} · {fileSize}
        </span>
      </a>
    )
  }

  return (
    <a href={href} onClick={onClick} className="block">
      <Button variant="secondary" className="h-12 w-full justify-start">
        <Download className="mr-2 size-4" />
        <span className="flex-1 truncate text-left">{fileName}</span>
        <span className="text-xs text-muted-foreground">{fileSize}</span>
      </Button>
    </a>
  )
}
