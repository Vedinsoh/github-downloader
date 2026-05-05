"use client";

import Link from "next/link";
import { type DeviceClass, type Os } from "@/lib/classify-asset";
import type { RenderRelease } from "@/lib/build-download-url";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ReleaseAssets } from "./release-assets";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type Props = {
  release: RenderRelease;
  owner: string;
  repo: string;
  visitorOs: Os;
  deviceClass: DeviceClass;
  latest?: boolean;
};

export function ReleaseCard({ release, owner, repo, visitorOs, deviceClass, latest }: Props) {
  const versionLabel = release.tag;
  const releaseLink = `/${owner}/${repo}/v/${encodeURIComponent(release.tag)}`;

  let cardClass = "";
  switch (true) {
    case latest:
      cardClass = "ring-green-500";
      break;
    case release.pre:
      cardClass = "ring-yellow-900 bg-opaque/10";
      break;
  }

  return (
    <Card className={cardClass}>
      <CardHeader className="flex flex-row flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2">
          <CardTitle className="text-xl">
            <Link href={releaseLink} className="hover:underline" prefetch={false}>
              Version {versionLabel}
            </Link>
          </CardTitle>
          {release.pre ? <Badge variant="destructive">Beta</Badge> : null}
          {latest ? <Badge variant="success">Latest</Badge> : null}
        </div>
        <div>
          {release.date ? (
            <span className="text-muted-foreground w-full text-xs">
              {dayjs(release.date).fromNow()}
            </span>
          ) : null}
        </div>
      </CardHeader>

      <CardContent>
        <ReleaseAssets
          assets={release.assets}
          visitorOs={visitorOs}
          deviceClass={deviceClass}
          repo={`${owner}/${repo}`}
        />
      </CardContent>
    </Card>
  );
}
