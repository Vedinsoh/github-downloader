"use client"

import { track } from "@vercel/analytics"
import { Download } from "lucide-react"
import { Button } from "./ui/button"
import { OS_ICONS, OS_LABELS, type Os } from "@/lib/classify-asset"
import React from 'react'

type Props = {
  href: string
  os: Os
  architectureLabel: string
  fileName: string
  fileSize: string
  assetName: string
  repo: string
  primary?: boolean
  sibling?: boolean
  isSource?: boolean
  mode?: "archive-primary" | "os-build"
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
  sibling,
  isSource,
  mode,
}: Props) {
  function onClick() {
    track("download_click", {
      repo,
      asset_name: assetName,
      os,
      is_source: Boolean(isSource),
      mode: mode ?? "os-build",
    })
  }

  if (primary) {
    return (
      <a href={href} onClick={onClick} className="block">
        <Button className="h-14 w-full bg-blue-600 text-base text-white hover:bg-blue-700">
          {React.createElement(OS_ICONS[os], { className: "size-6" })}
          <span>
            Download for {OS_LABELS[os]}
            {architectureLabel ? ` (${architectureLabel})` : ""}
          </span>
          <Download className="size-5" />
        </Button>
        <span className="mt-2 block text-xs text-muted-foreground">
          {fileName} · {fileSize}
        </span>
      </a>
    )
  }

  if (sibling) {
    const label = architectureLabel || "Other build"
    return (
      <a href={href} onClick={onClick} className="inline-block">
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 rounded-full px-3 text-xs"
          title={`${fileName} · ${fileSize}`}
        >
          {React.createElement(OS_ICONS[os], { className: "size-3.5" })}
          <span>{label}</span>
          <span className="text-muted-foreground">· {fileSize}</span>
          <Download className="size-3.5" />
        </Button>
      </a>
    )
  }

  return (
    <a href={href} onClick={onClick} className="block">
      <Button variant="secondary" className="h-12 w-full justify-start">
        {React.createElement(OS_ICONS[os], { className: "size-4" })}
        <span className="flex-1 truncate text-left">{fileName}</span>
        <span className="text-xs text-muted-foreground">{fileSize}</span>
        <Download className="size-4" />
      </Button>
    </a>
  )
}
