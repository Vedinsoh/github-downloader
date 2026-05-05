@AGENTS.md

# githubdl

A friendly wrapper around GitHub releases. Paste any repo link and get the downloads, with the matching OS surfaced first.

Domain: `githubdl.com`. Routes: `githubdl.com/{owner}/{repo}` → releases; `…/v/{version}` → version deep-link.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind v4 + shadcn/ui
- Zod 4 — input parsing, route segment validation, GitHub API response shape
- pnpm
- **Cloudflare Workers Paid** hosting via `@opennextjs/cloudflare`
- **Cloudflare KV** (`KV_RELEASES`) — application source-of-truth for releases blob + tags index
- **Cloudflare R2** (`NEXT_INC_CACHE_R2_BUCKET`) — OpenNext incremental cache (backs `unstable_cache`)
- **Cloudflare D1** (`NEXT_TAG_CACHE_D1`) — OpenNext tag cache (powers `revalidateTag`)
- **Durable Objects** (`NEXT_CACHE_DO_QUEUE` → `DOQueueHandler`) — OpenNext revalidation queue
- **Workers Rate Limiting bindings** (`RATE_LIMIT_GENERAL` 60/60s, `RATE_LIMIT_VERSION` 10/60s) — gating in Worker entry shim
- **Workers Analytics Engine** (`ANALYTICS` → `githubdl_events`) — `download_click` custom event
- **Cloudflare Web Analytics** — cookieless pageviews + RUM (no consent banner needed)
- Vitest — pure-function unit tests only

## Architecture

### Data flow

Three-layer read path:

```
Request → Worker entry shim (rate limit + verified-bot bypass)
  ↓
Next.js handler (OpenNext)
  ↓
unstable_cache (6h TTL, tag "repo:{o}/{r}", backed by R2 incremental cache)
  ↓ miss
Cloudflare KV (7-day TTL, source-of-truth)
  ↓ miss / chunk-expansion
GitHub REST + GraphQL
```

Releases are stored in Cloudflare KV as the source-of-truth (`StoredReleaseSet` per
repo: 30 releases per chunk, plus singleton merges from `/v/{tag}` deep-links).
A separate `StoredTagsIndex` walks all release tag names via the GraphQL API so
that `/v/{unknown-tag}` short-circuits without a GitHub round-trip. `unstable_cache`
sits in front of both reads with a 6h TTL, tagged by `repo:{owner}/{repo}` so that
on-demand invalidation can use `revalidateTag` (D1 tag cache) + `kv.delete()` together.

`fetchRepo` (repo metadata) stays in `unstable_cache` only — no KV layer. TTL is 6h.

`?beta=show` on the repo page is the URL-only toggle for prerelease visibility.
Cache key includes `includeBetas` so the two views are cached separately. Pages
with `?beta=show` are `noindex`.

### File map

```
worker.ts                            Worker entry shim — rate limit + verified-bot bypass, then OpenNext
worker-env.d.ts                      ambient types for the OpenNext-generated worker bundle
open-next.config.ts                  OpenNext config — R2 incremental, DO queue, D1 tag cache
wrangler.toml                        Wrangler config — bindings, DO migrations, rate-limit namespaces
src/
  app/
    layout.tsx                       root layout, fonts, CF Web Analytics beacon, theme script
    not-found.tsx                    global 404 page
    actions.ts                       server action: parse paste → redirect
    (home)/layout.tsx                <Navbar showSearch={false} /> wrapper
    (home)/page.tsx                  homepage (hero + form)
    (app)/layout.tsx                 <Navbar /> wrapper (search visible)
    (app)/[owner]/[repo]/page.tsx    releases list, paginated, ?beta=show toggle
    (app)/[owner]/[repo]/v/[version]/ version deep-link page (noindex)
    (app)/about|privacy|terms/page.tsx static legal pages
    og/route.tsx                     OG image (Node runtime ImageResponse, no version)
    api/track/download/route.ts      POST endpoint for sendBeacon download_click → Workers AE
    robots.ts                        robots.txt generator
  components/
    ui/                              shadcn primitives
    site-footer.tsx
    repo-link-form.tsx               client form (useActionState), used by homepage + not-found
    repo-header.tsx
    release-card.tsx                 orchestrates per-release UI
    download-button.tsx              client; fires sendBeacon('/api/track/download', ...)
    other-downloads.tsx              collapsed section, grouped by OS
    beta-toggle.tsx                  client; useSearchParams + router.replace
    error-states.tsx                 busy/notfound/no-releases/version-notfound/unavailable
  lib/
    parse-input.ts                   Zod schemas + parseRepoInput
    classify-asset.ts                filename → OS + architecture (operates on StoredAsset)
    detect-os.ts                     User-Agent → OS (ua-parser-js)
    format.ts                        bytes / date helpers
    github/
      schemas.ts                     Zod schemas for GitHub REST responses
      client.ts                      ghFetch + fetchRepo + fetchReleasesChunk + fetchReleaseByTagRaw
      graphql.ts                     ghGraphQL + walkReleaseTags (tag-name walker)
    store/
      schemas.ts                     StoredAsset / StoredRelease / StoredReleaseSet / StoredTagsIndex (Zod)
      kv.ts                          Cloudflare KV wrapper, UnavailableError, getJSON/setJSON
      to-stored.ts                   Release → StoredRelease (drops fields, filters skippables)
      merge.ts                       merge-by-tag, sort by date desc
      slice.ts                       windowed pagination over chunks*30
      latest-stable.ts               computeLatestStable + pickLatest (stable-first, then any)
      releases.ts                    getReleasesPage + getReleaseByTag + getOrSeedBlob
      resolve-latest.ts              resolveLatestTag (alias for /v/latest)
      tags-index.ts                  getTagsIndex + buildTagsIndex (capped at 20 walks) + mergeNewTags
```

### Routing & validation

Catch-all `[owner]/[repo]` validates against:

- `ownerSchema` (GitHub username regex + reserved-name denylist: `api`, `about`, `privacy`, `terms`, `og`, `_next`, `favicon.ico`, `robots.txt`, `sitemap.xml`)
- `repoSchema` (GitHub repo regex, no `.` or `..`)
- `?page` clamped 1..20; out-of-range → 404 (low cap; non-technical audience never paginates deep, and high `N` was a cache-busting abuse vector)
- `versionSchema` (1..255, no control chars)

Invalid → `notFound()`. Reserved owner names → `notFound()`.

`/v/latest` is a reserved alias (case-insensitive). It resolves against the
releases blob via `resolveLatestTag` — preferring the latest non-prerelease,
falling back to the first release if every release is a prerelease — then
emits a 307 redirect to `/v/{tag}`. Real release tags literally named `latest`
are shadowed; this is acceptable for our audience. Paste-input recognizes
`https://github.com/{owner}/{repo}/releases/latest` and routes to the alias.

### Errors (handled in releases page)

- GitHub 404 → friendly NotFoundState (no private/public distinction; we can't tell)
- GitHub 301 → server-side redirect to new canonical path
- 403/429 with `x-ratelimit-remaining=0` → BusyState
- 5xx → BusyState
- Empty release list → NoReleasesState
- Missing tag on `/v/{version}`, confirmed against complete tags-index → VersionNotFoundState (zero GH calls)
- KV read failure → TemporarilyUnavailableState (hard-fail)
- KV write failure → soft-fail; request continues with in-memory data (logged)
- Hard 404 (invalid route, reserved owner names, invalid version syntax) → `app/not-found.tsx`

### UX

Vocabulary mapping (UI is non-technical):

| GitHub                   | UI label                                |
| ------------------------ | --------------------------------------- |
| Release                  | Version                                 |
| Pre-release              | Beta badge                              |
| Asset                    | Download                                |
| Source code (zip/tar.gz) | Source code (for developers), collapsed |

Per release:

1. Big primary button: "Download for {detected OS}" + architecture + filename + size
2. Other-OS downloads collapsed in `<OtherDownloads>`
3. Source code under collapsible `<details>`

OS detection from `User-Agent` header on server. Asset classification from filename — see `classify-asset.ts` for the regex priority order.

### SEO

- Self-canonical to `https://githubdl.com/{owner}/{repo}`
- Per-page `<title>` and meta description
- JSON-LD `SoftwareApplication` with `downloadUrl` and `softwareVersion` (only when at least one asset exists)
- OG image at `/og?owner=…&repo=…` — repo metadata only, no version (cached 24 h via Cloudflare cache rule)
- `robots.txt` allows root + repo pages, disallows `/api/`, `/og`, `/*?page=`, `/*?beta=`, `/*/v/`
- `/v/{version}` and pages 2+ are `noindex`
- No sitemap (infinite URL space)

### Rate limit & abuse

`worker.ts` (Worker entry shim) runs before OpenNext on every request:

1. Read `request.cf.botManagement.verifiedBot` — if true, skip both limiters.
2. Else key by `CF-Connecting-IP` → check `RATE_LIMIT_GENERAL` (60/60s).
3. For paths matching `/^/[^/]+/[^/]+/v//`, additionally check `RATE_LIMIT_VERSION` (10/60s).
4. On `success: false` → 429 with `Cache-Control: no-store`.

Workers `RateLimit` bindings are eventually-consistent and node-local — fine for our threat model. A second layer of WAF Rate Limiting Rule (1 free slot, 10s window, IP) provides edge-side redundancy before the Worker even runs.

In `pnpm dev` (Next dev mode without Wrangler), the rate limiter has no binding and is implicitly skipped by `worker.ts` — but `worker.ts` itself isn't executed in `next dev`. Use `pnpm dev:worker` to verify limiter behavior end-to-end.

## Decisions worth knowing

- **Hybrid SSR over client-only fetch.** Browser-side calls would scale infinitely (each user gets their own 60/hr GitHub bucket) but loses share-link OG previews. Discord/Slack unfurl is a key UX → server-render.
- **Versions excluded from OG metadata.** Caching is simpler, and Discord caches unfurls anyway.
- **Cloudflare Workers Paid from day one.** $5/mo ceiling lifts (50 ms CPU, 10 MiB bundle, 10M req/mo). Free tier's 10 ms CPU + 3 MiB cap can't fit OpenNext + Next 16 + `ImageResponse`.
- **Cloudflare KV over Upstash Redis.** Single-vendor, in-network (~5 ms reads vs ~30 ms cross-region HTTPS), eventually-consistent (≤60 s) acceptable for 7-day TTL data, free tier is generous.
- **Application data (KV) and Next cache (R2) are separate concerns.** KV stores our domain blobs. R2 stores OpenNext's per-page cache entries. D1 records tag invalidation timestamps. Each layer can fail independently without taking down the others.
- **Rate limit lives in Worker entry shim, not Next middleware.** The `RateLimit` binding is a Worker-level API; expressing it inside Next would require awkward bridging. OpenNext on Workers does not yet support Next 16's `proxy.ts` (issue opennextjs/opennextjs-cloudflare#962) — Worker-shim approach side-steps that constraint entirely.
- **No release notes / changelogs.** Audience is non-technical.
- **Version deep-links not suppressed from share-link UX.** The mod-maker / forum-distribution use case relies on `/v/{version}` working, even though it's `noindex`.
- **CF-native observability over Sentry.** Workers Logs + Workers Analytics Engine + Email Alerts cover our needs at zero added cost. Errors that matter already have explicit handling.
- **Cloudflare Web Analytics + Workers Analytics Engine, no third-party scripts.** No consent banner needed (cookieless), single-vendor, custom `download_click` event written via `sendBeacon` → Worker route → AE binding.

## Build-time gotchas

- **Do not rename `src/middleware.ts` → `src/proxy.ts`.** OpenNext on Workers does not yet recognize Next 16's `proxy` export (issue #962). We've removed Next-level middleware entirely; rate-limit logic lives in `worker.ts` instead.
- **`@opennextjs/cloudflare@1.19.6` requires `next@16.2.4` or higher within the 16.x line** (peer-deps exclude 16.0.0–16.2.2 due to a `loadManifest` regression in those versions). Don't bump Next ahead of OpenNext compat.
- **`compatibility_flags` must include both `nodejs_compat` and `global_fetch_strictly_public`.** The latter is needed for OpenNext's caching path (per its template).
- **`compatibility_date >= 2025-05-05`** for `FinalizationRegistry` support (used by OpenNext internals).
- **`/og` route is Node runtime, not Edge.** OpenNext on Workers steers away from Edge runtime; `ImageResponse` works fine on Node. Do NOT add `export const runtime = "edge"`.
- **`generateMetadata` and the page receive `params` as a `Promise`** in Next 16 App Router — always `await` before destructuring. Same for `searchParams`.
- **`useActionState` (not `useFormState`)** for the homepage form — React 19 API, `useFormState` is deprecated.
- **shadcn `init` flags differ from older guides.** Use `-d -t next -b radix --yes --no-monorepo`. There is no `--base-color` flag anymore.
- **`worker.ts` imports from `./.open-next/worker.js`**, which only exists after `opennextjs-cloudflare build`. The `worker-env.d.ts` ambient declaration keeps `tsc --noEmit` green when the artifact is absent.
- **`KV_RELEASES` binding access uses `getCloudflareContext()`** from `@opennextjs/cloudflare`. In `next dev` (no Workers runtime) this returns null and `kv.ts` no-ops the same way the old Upstash wrapper did.

## Caching contract

| Layer                                  | Key                                                      | TTL | Tag            | Backend |
| -------------------------------------- | -------------------------------------------------------- | --- | -------------- | ------- |
| `unstable_cache` for `getReleasesPage` | `["releases", o, r, String(page), String(includeBetas)]` | 6h  | `repo:{o}/{r}` | R2 (OpenNext) |
| `unstable_cache` for `getReleaseByTag` | `["release-tag", o, r, tag]`                             | 6h  | `repo:{o}/{r}` | R2 (OpenNext) |
| `unstable_cache` for `fetchRepo`       | per Next Data Cache                                      | 6h  | `repo:{o}/{r}` | R2 (OpenNext) |
| KV `repo:{o}/{r}:releases`             | —                                                        | 7d  | —              | KV (`KV_RELEASES`) |
| KV `repo:{o}/{r}:tags`                 | —                                                        | 7d  | —              | KV (`KV_RELEASES`) |
| Tag invalidation timestamps            | per tag                                                  | —   | —              | D1 (`NEXT_TAG_CACHE_D1`) |

- **On-demand refresh** = `revalidateTag("repo:{o}/{r}")` (drops the R2-backed Next cache entries via D1) + `kv.delete("repo:{o}/{r}:releases")` + `kv.delete("repo:{o}/{r}:tags")`.
- **Every successful KV write** sets `expirationTtl: 604800` to refresh the 7-day window for actively-used repos.
- **Never put per-request data into the `fetch()` URL or headers** for GitHub calls — would shatter the Data Cache. The token goes in `Authorization` header, fine because it's identical across requests.
- The `redirect: "manual"` on `ghFetch` is intentional — we want to _see_ GitHub's 301 and re-emit it as our own redirect to the new canonical path. If you switch to default `redirect: "follow"`, the rename-handling path (`{ kind: "moved" }`) becomes unreachable.

## Cloudflare KV — write characteristics

KV is eventually consistent globally (≤60 s propagation between datacenters) and strongly consistent within a single edge node. For our 7-day TTL release blobs this is invisible to users — the worst case is a fresh write being momentarily invisible to a different region's reader, which simply triggers a re-fetch from GitHub. KV writes are rate-limited to 1/sec per key by Cloudflare; we never write the same key faster than that pattern. Read failures throw `UnavailableError` → `TemporarilyUnavailableState` (hard-fail load shed). Write failures are logged and swallowed (soft-fail).

## Asset classifier — how to extend

`src/lib/classify-asset.ts` regexes are **order-sensitive** (first match wins inside `detectOs`). When adding a new pattern:

1. Write a failing test in `classify-asset.test.ts` first with a real filename you saw in the wild.
2. Add the regex. Place broader extension hits (`.exe`, `.dmg`) before name-substring hits (`/win/`, `/mac/`).
3. Run `pnpm test` — make sure no existing test regresses.

`isSkippable: true` removes the asset from the UI entirely (signatures, checksums). `os: "unknown"` keeps it visible in "Other downloads".

## Things explicitly fenced out

24-item out-of-scope list locked during planning. Highlights: no search bar, no accounts, no release notes rendering, no dark mode toggle, no i18n, no RSS, no API surface, no donations, no PWA. **Don't add these without explicit ask** — the "dumb wrapper" identity is a deliberate product hypothesis.

## Commands

```bash
pnpm dev          # local Next dev (no Workers runtime; KV/limiter no-op)
pnpm dev:worker   # opennextjs-cloudflare build && wrangler dev (full bindings via Miniflare)
pnpm preview      # opennextjs-cloudflare build && wrangler dev --remote (against real CF resources)
pnpm build        # next build (Next-side production build)
pnpm build:worker # opennextjs-cloudflare build (produces .open-next/worker.js)
pnpm deploy       # build:worker && wrangler deploy
pnpm cf-typegen   # regenerate worker-configuration.d.ts from wrangler.toml bindings
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm test         # vitest run
pnpm test:watch   # vitest --watch
```

Always run `pnpm typecheck && pnpm lint && pnpm test && pnpm build` before declaring work done.

## Env vars

- `GITHUB_TOKEN` (Worker secret, required for production; `Authorization: Bearer ${token}` for both REST and GraphQL). Provision via `wrangler secret put GITHUB_TOKEN`.
- `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` (public, set in `[vars]` per env in `wrangler.toml`; controls whether the Cloudflare Web Analytics beacon renders).

In dev: copy `.dev.vars.example` to `.dev.vars` and fill in. `.dev.vars` is gitignored.

## Pre-launch checklist

- [ ] `wrangler kv namespace create KV_RELEASES` — paste id into `wrangler.toml`
- [ ] `wrangler r2 bucket create githubdl-inc-cache`
- [ ] `wrangler d1 create githubdl-tag-cache` — paste id into `wrangler.toml`
- [ ] `wrangler secret put GITHUB_TOKEN` (sensitive, scope `public_repo`)
- [ ] Cloudflare zone `githubdl.com`: add Workers Route `githubdl.com/*` → `githubdl`
- [ ] Cloudflare zone: Single Redirect `www.githubdl.com` → `githubdl.com` (301)
- [ ] Cloudflare zone: enable **Bot Fight Mode**
- [ ] Cloudflare zone: WAF Rate Limiting Rule (Free, 1 slot) — Managed Challenge when `(http.request.uri.path contains "/v/" and not cf.bot_management.verified_bot)`, IP, period 10s, requests 20
- [ ] Cloudflare zone: Cache Rule for `/og` — edge cache TTL 24h
- [ ] Cloudflare Web Analytics: add site, copy beacon token, set `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` per-env in `wrangler.toml`
- [ ] Cloudflare Email Routing: `info@githubdl.com` → your inbox
- [ ] Cloudflare Notifications: alert on Workers 5xx rate
- [ ] GitHub Actions secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- [ ] Smoke test (via `pnpm preview`): `/redis/redis`, `/godotengine/godot`, `/obsidianmd/obsidian`, `/oven-sh/bun`, a known-archived repo, a known-renamed repo, a 404 repo, `/v/{valid-tag}` deep-link, `/v/{invalid-tag}` deep-link, `/v/latest` (cold + warm), pasting a `/releases/latest` URL on the homepage, `download_click` writes to AE (verify via `wrangler tail` or AE SQL), burst-refresh trips `RATE_LIMIT_GENERAL`
