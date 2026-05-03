import { z } from "zod";
import { links } from "@/lib/constants/links";
import type { FetchError } from "./client";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";

type CacheConfig = { revalidate?: number; tags?: string[] };

export type GraphQLResult<T> = { ok: true; data: T } | { ok: false; error: FetchError };

export async function ghGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
  schema: z.ZodType<T>,
  cache?: CacheConfig,
): Promise<GraphQLResult<T>> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": links.app.hostname,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    ...(cache ? { next: cache } : {}),
  });

  if (res.status === 404) return { ok: false, error: { kind: "not_found" } };
  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (remaining === "0") return { ok: false, error: { kind: "rate_limited" } };
    return { ok: false, error: { kind: "upstream", status: res.status } };
  }
  if (!res.ok) return { ok: false, error: { kind: "upstream", status: res.status } };

  const json = (await res.json()) as { data?: unknown; errors?: { type?: string }[] };

  if (json.errors && json.errors.length > 0) {
    const notFound = json.errors.some((e) => e.type === "NOT_FOUND");
    if (notFound) return { ok: false, error: { kind: "not_found" } };
    return { ok: false, error: { kind: "upstream", status: 200 } };
  }

  const parsed = schema.safeParse(json.data);
  if (!parsed.success) {
    return { ok: false, error: { kind: "schema_drift", issues: parsed.error.issues } };
  }
  return { ok: true, data: parsed.data };
}

const walkReleaseTagsSchema = z.object({
  repository: z
    .object({
      releases: z.object({
        nodes: z.array(z.object({ tagName: z.string() })),
        pageInfo: z.object({
          hasNextPage: z.boolean(),
          endCursor: z.string().nullable(),
        }),
      }),
    })
    .nullable(),
});

const WALK_RELEASE_TAGS_QUERY = `
query($owner:String!, $name:String!, $after:String, $first:Int!) {
  repository(owner:$owner, name:$name) {
    releases(first:$first, after:$after, orderBy:{field:CREATED_AT, direction:DESC}) {
      nodes { tagName }
      pageInfo { hasNextPage endCursor }
    }
  }
}`;

export type WalkReleaseTagsPage = {
  tags: string[];
  hasNextPage: boolean;
  endCursor: string | null;
};

export async function walkReleaseTags(
  owner: string,
  name: string,
  after: string | null,
  first = 100,
): Promise<GraphQLResult<WalkReleaseTagsPage>> {
  const result = await ghGraphQL(
    WALK_RELEASE_TAGS_QUERY,
    { owner, name, after, first },
    walkReleaseTagsSchema,
  );
  if (!result.ok) return result;
  if (!result.data.repository) {
    return { ok: false, error: { kind: "not_found" } };
  }
  const { nodes, pageInfo } = result.data.repository.releases;
  return {
    ok: true,
    data: {
      tags: nodes.map((n) => n.tagName),
      hasNextPage: pageInfo.hasNextPage,
      endCursor: pageInfo.endCursor,
    },
  };
}
