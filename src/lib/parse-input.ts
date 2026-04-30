import { z } from "zod"
import { classifyRest } from "./classify-rest"

const ownerRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/
const repoRegex = /^[a-zA-Z0-9._-]{1,100}$/

const RESERVED_OWNERS = new Set([
  "api",
  "about",
  "privacy",
  "terms",
  "og",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
])

export const ownerSchema = z
  .string()
  .regex(ownerRegex)
  .refine((v) => !RESERVED_OWNERS.has(v.toLowerCase()), {
    message: "Reserved owner name",
  })

export const repoSchema = z
  .string()
  .regex(repoRegex)
  .refine((v) => v !== "." && v !== "..", { message: "Invalid repo name" })

export const versionSchema = z
  .string()
  .min(1)
  .max(255)
  .refine((v) => !/[\x00-\x1f\x7f]/.test(v), { message: "Invalid characters" })

export type ParseResult =
  | { ok: true; owner: string; repo: string; version?: string }
  | { ok: false; error: string }

export function parseRepoInput(raw: string): ParseResult {
  if (typeof raw !== "string") {
    return { ok: false, error: "Please paste a link to a GitHub repository." }
  }

  let s = raw.trim()
  if (!s) {
    return { ok: false, error: "Please paste a link to a GitHub repository." }
  }

  s = s.replace(/^https?:\/\//i, "").replace(/^www\./i, "")
  s = s.replace(/^github\.com\//i, "")
  s = s.replace(/\.git(?:\/.*)?$/i, "")
  s = s.replace(/^\/+/, "").replace(/\/+$/, "")

  const parts = s.split("/").filter(Boolean)
  if (parts.length < 2) {
    return { ok: false, error: "Please paste a link to a GitHub repository." }
  }

  const [owner, repo] = parts
  const ownerCheck = ownerSchema.safeParse(owner)
  const repoCheck = repoSchema.safeParse(repo)

  if (!ownerCheck.success || !repoCheck.success) {
    return { ok: false, error: "That doesn't look like a GitHub repository." }
  }

  const { version } = classifyRest(parts.slice(2))
  return version ? { ok: true, owner, repo, version } : { ok: true, owner, repo }
}
