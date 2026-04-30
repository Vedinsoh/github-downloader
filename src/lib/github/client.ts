import { z } from "zod"
import {
  releaseListSchema,
  releaseSchema,
  repoSchema,
  type Release,
  type Repo,
} from "./schemas"
import { links } from '../constants/links';

const GITHUB_API = "https://api.github.com"

export type FetchError =
  | { kind: "not_found" }
  | { kind: "rate_limited" }
  | { kind: "upstream"; status: number }
  | { kind: "schema_drift"; issues: z.core.$ZodIssue[] }
  | { kind: "moved"; owner: string; repo: string }

export type FetchResult<T> = { ok: true; data: T } | { ok: false; error: FetchError }

type CacheConfig = { revalidate: number; tags: string[] }

async function ghFetch(
  path: string,
  cache: CacheConfig
): Promise<Response | FetchError> {
  const token = process.env.GITHUB_TOKEN
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": links.app.hostname,
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${GITHUB_API}${path}`, {
    headers,
    next: cache,
    redirect: "manual",
  })

  if (res.status === 301 || res.status === 302 || res.status === 307) {
    const location = res.headers.get("location") ?? ""
    const match = location.match(/\/repos\/([^/]+)\/([^/?#]+)/)
    if (match) {
      return { kind: "moved", owner: match[1], repo: match[2] }
    }
  }

  if (res.status === 404) return { kind: "not_found" }
  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get("x-ratelimit-remaining")
    if (remaining === "0") return { kind: "rate_limited" }
    return { kind: "upstream", status: res.status }
  }
  if (!res.ok) return { kind: "upstream", status: res.status }

  return res
}

function isFetchError(v: Response | FetchError): v is FetchError {
  return !(v instanceof Response)
}

export async function fetchRepo(
  owner: string,
  repo: string
): Promise<FetchResult<Repo>> {
  const res = await ghFetch(`/repos/${owner}/${repo}`, {
    revalidate: 1800,
    tags: [`repo:${owner}/${repo}`],
  })
  if (isFetchError(res)) return { ok: false, error: res }

  const json = await res.json()
  const parsed = repoSchema.safeParse(json)
  if (!parsed.success)
    return { ok: false, error: { kind: "schema_drift", issues: parsed.error.issues } }
  return { ok: true, data: parsed.data }
}

export async function fetchReleases(
  owner: string,
  repo: string,
  page: number
): Promise<FetchResult<{ releases: Release[]; hasMore: boolean }>> {
  const res = await ghFetch(
    `/repos/${owner}/${repo}/releases?per_page=10&page=${page}`,
    {
      revalidate: page === 1 ? 1800 : 86400,
      tags: [`repo:${owner}/${repo}`, `repo:${owner}/${repo}:p${page}`],
    }
  )
  if (isFetchError(res)) return { ok: false, error: res }

  const linkHeader = res.headers.get("link") ?? ""
  const hasMore = /rel="next"/.test(linkHeader)

  const json = await res.json()
  const parsed = releaseListSchema.safeParse(json)
  if (!parsed.success)
    return { ok: false, error: { kind: "schema_drift", issues: parsed.error.issues } }

  const releases = parsed.data.filter((r) => !r.draft)
  return { ok: true, data: { releases, hasMore } }
}

export async function fetchReleaseByTag(
  owner: string,
  repo: string,
  tag: string
): Promise<FetchResult<Release>> {
  const encoded = encodeURIComponent(tag)
  const res = await ghFetch(`/repos/${owner}/${repo}/releases/tags/${encoded}`, {
    revalidate: 86400,
    tags: [`repo:${owner}/${repo}`, `repo:${owner}/${repo}:tag:${tag}`],
  })
  if (isFetchError(res)) return { ok: false, error: res }

  const json = await res.json()
  const parsed = releaseSchema.safeParse(json)
  if (!parsed.success)
    return { ok: false, error: { kind: "schema_drift", issues: parsed.error.issues } }
  if (parsed.data.draft) return { ok: false, error: { kind: "not_found" } }
  return { ok: true, data: parsed.data }
}
