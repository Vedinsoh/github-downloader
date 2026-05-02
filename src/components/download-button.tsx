"use client"

import { track } from "@vercel/analytics"
import { Download } from "lucide-react"
import { Button } from "./ui/button"
import { OS_ICONS, OS_LABELS, type Os } from "@/lib/classify-asset"
import { middleTruncate } from "@/lib/format"
import { cn } from "@/lib/utils"
import React from 'react'

type Props = Omit<React.ComponentPropsWithRef<"a">, "href" | "onClick"> & {
  href: string
  os: Os
  architectureLabel: string
  fileName: string
  fileSize: string
  assetName: string
  repo: string
  variant?: "primary" | "secondary" | "sibling"
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
  variant,
  isSource,
  mode,
  className,
  ...rest
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

  if (variant === "primary") {
    return (
      <a {...rest} href={href} onClick={onClick} className={cn("block", className)}>
        <Button className="h-auto min-h-14 w-full whitespace-normal bg-blue-600 px-4 py-3 text-white hover:bg-blue-700">
          {React.createElement(OS_ICONS[os], { className: "size-6 shrink-0" })}
          <span className="flex-1 text-left text-balance">
            <span className="block text-base font-medium leading-tight">
              Download for {OS_LABELS[os]}
            </span>
            {architectureLabel ? (
              <span className="mt-0.5 block text-xs font-normal leading-tight opacity-90">
                {architectureLabel}
              </span>
            ) : null}
          </span>
          <Download className="size-5 shrink-0" />
        </Button>
        <span className="mt-2 block break-all text-xs text-muted-foreground">
          {fileName} · {fileSize}
        </span>
      </a>
    )
  }

  if (variant === "sibling") {
    return (
      <a
        {...rest}
        href={href}
        onClick={onClick}
        className={cn("inline-block", className)}
        title={`${fileName} · ${fileSize}`}
      >
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 rounded-full px-3 text-xs"
        >
          {React.createElement(OS_ICONS[os], { className: "size-3.5" })}
          <span>{architectureLabel}</span>
          <Download className="size-3.5" />
        </Button>
      </a>
    )
  }

  const { prefix, suffix } = middleTruncate(fileName)
  return (
    <a {...rest} href={href} onClick={onClick} className={cn("block", className)} title={fileName}>
      <Button variant="secondary" className="h-12 w-full justify-start">
        {React.createElement(OS_ICONS[os], { className: "size-4 shrink-0" })}
        <span className="flex min-w-0 flex-1 text-left">
          {prefix ? <span className="truncate">{prefix}</span> : null}
          <span className="shrink-0">{suffix}</span>
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">{fileSize}</span>
        <Download className="size-4 shrink-0" />
      </Button>
    </a>
  )
}
