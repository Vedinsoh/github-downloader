import { z } from "zod";

export const storedAssetSchema = z.object({
  name: z.string(),
  size: z.number(),
  url: z.string(),
});

export const storedReleaseSchema = z.object({
  tag: z.string(),
  pre: z.boolean(),
  date: z.string().nullable(),
  assets: z.array(storedAssetSchema),
});

export const storedReleaseSetSchema = z.object({
  chunks: z.number(),
  releases: z.array(storedReleaseSchema),
  hasMore: z.boolean(),
  fetchedAt: z.number(),
});

export const storedTagsIndexSchema = z.object({
  tags: z.array(z.string()),
  complete: z.boolean(),
  cursor: z.string().nullable(),
  fetchedAt: z.number(),
});

export type StoredAsset = z.infer<typeof storedAssetSchema>;
export type StoredRelease = z.infer<typeof storedReleaseSchema>;
export type StoredReleaseSet = z.infer<typeof storedReleaseSetSchema>;
export type StoredTagsIndex = z.infer<typeof storedTagsIndexSchema>;
