import type { Release, ReleaseAsset } from "@/lib/github/schemas";
import { classifyAsset } from "@/lib/classify-asset";
import type { StoredAsset, StoredRelease } from "./schemas";

function toStoredAsset(asset: ReleaseAsset): StoredAsset {
  return {
    name: asset.name,
    size: asset.size,
    url: asset.browser_download_url,
  };
}

export function toStored(release: Release): StoredRelease {
  const assets = release.assets
    .filter((a) => !classifyAsset(a.name).isSkippable)
    .map(toStoredAsset);
  return {
    tag: release.tag_name,
    pre: release.prerelease,
    date: release.published_at,
    assets,
  };
}
