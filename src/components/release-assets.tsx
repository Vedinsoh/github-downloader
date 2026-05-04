"use client";

import {
  classifyRelease,
  getArchitectureLabel,
  OS_LABELS,
  type DeviceClass,
  type Os,
} from "@/lib/classify-asset";
import { formatBytes } from "@/lib/format";
import type { RenderAsset } from "@/lib/build-download-url";
import { DownloadButton } from "./download-button";
import { OtherDownloads } from "./other-downloads";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type Props = {
  assets: RenderAsset[];
  visitorOs: Os;
  deviceClass: DeviceClass;
  repo: string;
};

export function ReleaseAssets({ assets, visitorOs, deviceClass, repo }: Props) {
  const classified = classifyRelease(assets, visitorOs);

  if (classified.mode === "empty") {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
        No downloads available
      </p>
    );
  }

  if (classified.mode === "archive-primary") {
    return (
      <div className="space-y-2">
        {classified.archives.map(({ asset, info }) => (
          <DownloadButton
            key={asset.name}
            href={asset.url}
            os={info.os}
            architectureLabel={getArchitectureLabel(info.os, info.architecture)}
            fileName={asset.name}
            fileSize={formatBytes(asset.size)}
            assetName={asset.name}
            repo={repo}
            mode="archive-primary"
          />
        ))}
      </div>
    );
  }

  const { primary, sameOsSiblings, others } = classified;

  return (
    <div className="space-y-6">
      {primary ? (
        <div className="space-y-3">
          <DownloadButton
            variant="primary"
            href={primary.asset.url}
            os={primary.info.os}
            architectureLabel={getArchitectureLabel(primary.info.os, primary.info.architecture)}
            fileName={primary.asset.name}
            fileSize={formatBytes(primary.asset.size)}
            assetName={primary.asset.name}
            repo={repo}
            mode="os-build"
          />
          {sameOsSiblings.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-xs">Also available:</span>
              {sameOsSiblings.map(({ asset, info }) => (
                <Tooltip key={asset.name}>
                  <TooltipTrigger asChild>
                    <DownloadButton
                      variant="sibling"
                      href={asset.url}
                      os={info.os}
                      architectureLabel={getArchitectureLabel(info.os, info.architecture)}
                      fileName={asset.name}
                      fileSize={formatBytes(asset.size)}
                      assetName={asset.name}
                      repo={repo}
                      mode="os-build"
                    />
                  </TooltipTrigger>
                  <TooltipContent>{asset.name}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
          No download for {OS_LABELS[visitorOs]} in this version. See other systems below.
        </p>
      )}

      {others.length > 0 ? (
        <OtherDownloads
          items={others}
          repo={repo}
          deviceClass={deviceClass}
          visitorOs={visitorOs}
        />
      ) : null}
    </div>
  );
}
