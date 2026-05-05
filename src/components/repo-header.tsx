import type { Repo } from "@/lib/github/schemas";
import { Button } from "./ui/button";
import { FaGithub } from "react-icons/fa";
import { Card, CardContent } from "./ui/card";

export function RepoHeader({ repo }: { repo: Repo }) {
  const repoUrl = repo.html_url;
  const repoOwnerUrl = repo.owner.html_url;

  return (
    <header className="space-y-3">
      {repo.archived ? (
        <Card className="mb-8 ring-2 ring-orange-400/50">
          <CardContent>
            <p>This project is no longer maintained.</p>
          </CardContent>
        </Card>
      ) : null}
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={repo.owner.avatar_url}
          alt=""
          width={36}
          height={36}
          className="rounded-full"
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
