import type { StoredAsset, StoredRelease } from "./store/schemas";

export type RenderAsset = StoredAsset & { url: string };
export type RenderRelease = Omit<StoredRelease, "assets"> & { assets: RenderAsset[] };

export function buildDownloadUrl(
  owner: string,
  repo: string,
  tag: string,
  name: string,
): string {
  return `https://github.com/${owner}/${repo}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(name)}`;
}

export function hydrateForRender(
  owner: string,
  repo: string,
  releases: StoredRelease[],
): RenderRelease[] {
  return releases.map((r) => hydrateRelease(owner, repo, r));
}

export function hydrateRelease(
  owner: string,
  repo: string,
  release: StoredRelease,
): RenderRelease {
  return {
    ...release,
    assets: release.assets.map((a) => ({
      ...a,
      url: buildDownloadUrl(owner, repo, release.tag, a.name),
    })),
  };
}
