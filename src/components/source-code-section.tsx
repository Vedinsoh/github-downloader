"use client"

import { track } from "@vercel/analytics"
import { FileArchive } from "lucide-react"

type Props = {
  tarball: string | null
  zipball: string | null
  tag: string
  repo: string
}

export function SourceCodeSection({ tarball, zipball, tag, repo }: Props) {
  if (!tarball && !zipball) return null

  const [owner, repoName] = repo.split("/")
  const zipDirect = `https://github.com/${owner}/${repoName}/archive/refs/tags/${encodeURIComponent(tag)}.zip`
  const tarDirect = `https://github.com/${owner}/${repoName}/archive/refs/tags/${encodeURIComponent(tag)}.tar.gz`

  function onClick(format: "zip" | "tar.gz") {
    track("download_click", {
      repo,
      asset_name: `source.${format}`,
      os: "unknown",
      is_source: true,
    })
  }

  return (
    <details className="group rounded-md border bg-muted/30 p-3 text-sm">
      <summary className="cursor-pointer list-none text-muted-foreground hover:text-foreground">
        <span className="inline-flex items-center gap-2">
          <FileArchive className="size-4" />
          Source code (for developers)
        </span>
      </summary>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={zipDirect}
          onClick={() => onClick("zip")}
          className="rounded border bg-background px-3 py-1.5 hover:bg-accent"
        >
          Source.zip
        </a>
        <a
          href={tarDirect}
          onClick={() => onClick("tar.gz")}
          className="rounded border bg-background px-3 py-1.5 hover:bg-accent"
        >
          Source.tar.gz
        </a>
      </div>
    </details>
  )
}
