import Image from "next/image";
import { Badge } from "./ui/badge";
import type { Repo } from "@/lib/github/schemas";
import { Button } from "./ui/button";
import { FaGithub } from "react-icons/fa";

export function RepoHeader({ repo }: { repo: Repo }) {
  const repoUrl = repo.html_url;
  const repoOwnerUrl = repo.owner.html_url;

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
            <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {repo.name}
            </a>
          </h1>
          <p className="text-muted-foreground text-sm">
            by{" "}
            <a
              href={repoOwnerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {repo.owner.login}
            </a>
          </p>
        </div>
        {repo.archived ? <Badge variant="destructive">No longer maintained</Badge> : null}
        <Button variant="ghost" size="icon">
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground inline-flex items-center text-sm"
          >
            <FaGithub />
          </a>
        </Button>
      </div>
      {repo.description ? (
        <p className="text-muted-foreground text-base">{repo.description}</p>
      ) : null}
    </header>
  );
}
