import { FileArchive } from "lucide-react";
import {
  getArchitectureLabel,
  getOtherDownloadsOrder,
  OS_LABELS,
  sortItemsByArch,
  type ClassifiedAsset,
  type DeviceClass,
  type Os,
} from "@/lib/classify-asset";
import { formatBytes } from "@/lib/format";
import type { StoredAsset } from "@/lib/store/schemas";
import { DownloadButton } from "./download-button";

type Item = { asset: StoredAsset; info: ClassifiedAsset };

export function OtherDownloads({
  items,
  repo,
  deviceClass,
  visitorOs,
}: {
  items: Item[];
  repo: string;
  deviceClass: DeviceClass;
  visitorOs: Os;
}) {
  const groupedByOs = items.reduce<Record<Os, Item[]>>(
    (acc, item) => {
      acc[item.info.os].push(item);
      return acc;
    },
    {
      windows: [],
      mac: [],
      linux: [],
      android: [],
      ios: [],
      unknown: [],
    },
  );

  const order = getOtherDownloadsOrder(deviceClass, visitorOs);
  const orderedGroups = order
    .map((os) => ({ os, items: sortItemsByArch(groupedByOs[os], os) }))
    .filter((group) => group.items.length > 0);

  return (
    <details className="group bg-muted/30 rounded-md border p-3 text-sm">
      <summary className="text-muted-foreground hover:text-foreground cursor-pointer list-none">
        <span className="inline-flex items-center gap-2">
          <FileArchive className="size-4" />
          Other downloads
        </span>
      </summary>
      <div className="mt-4 space-y-4">
        {orderedGroups.map((group) => (
          <section key={group.os}>
            <h4 className="text-muted-foreground mb-2 inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase">
              <span>{OS_LABELS[group.os]}</span>
            </h4>
            <div className="space-y-2">
              {group.items.map((item) => (
                <DownloadButton
                  key={item.asset.name}
                  href={item.asset.url}
                  os={item.info.os}
                  architectureLabel={getArchitectureLabel(item.info.os, item.info.architecture)}
                  fileName={item.asset.name}
                  fileSize={formatBytes(item.asset.size)}
                  assetName={item.asset.name}
                  repo={repo}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </details>
  );
}
