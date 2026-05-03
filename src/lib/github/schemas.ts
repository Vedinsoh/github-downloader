import { z } from "zod";

export const repoSchema = z.object({
  full_name: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  archived: z.boolean(),
  html_url: z.string(),
  owner: z.object({
    login: z.string(),
    avatar_url: z.string(),
    html_url: z.string(),
  }),
});

export const releaseAssetSchema = z.object({
  id: z.number(),
  name: z.string(),
  size: z.number(),
  download_count: z.number(),
  browser_download_url: z.string(),
  content_type: z.string().optional(),
});

export const releaseSchema = z.object({
  id: z.number(),
  tag_name: z.string(),
  name: z.string().nullable(),
  draft: z.boolean(),
  prerelease: z.boolean(),
  published_at: z.string().nullable(),
  html_url: z.string(),
  assets: z.array(releaseAssetSchema),
});

export const releaseListSchema = z.array(releaseSchema);

export type Repo = z.infer<typeof repoSchema>;
export type Release = z.infer<typeof releaseSchema>;
export type ReleaseAsset = z.infer<typeof releaseAssetSchema>;
