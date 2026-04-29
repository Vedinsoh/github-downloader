import Image from "next/image"
import { Badge } from "./ui/badge"
import type { Repo } from "@/lib/github/schemas"

export function RepoHeader({ repo }: { repo: Repo }) {
  return (
    <header className="space-y-3">
      <div className="flex items-center gap-3">
        <Image
          src={repo.owner.avatar_url}
          alt=""
          width={36}
          height={36}
          className="rounded-full"
          unoptimized
        />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {repo.name}
          </h1>
          <p className="text-sm text-muted-foreground">by {repo.owner.login}</p>
        </div>
        {repo.archived ? <Badge variant="secondary">No longer maintained</Badge> : null}
      </div>
      {repo.description ? (
        <p className="text-base text-muted-foreground">{repo.description}</p>
      ) : null}
      <a
        href={repo.html_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-sm text-muted-foreground hover:underline"
      >
        View on GitHub →
      </a>
    </header>
  )
}
