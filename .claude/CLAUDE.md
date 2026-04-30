@AGENTS.md

# githubdl

A friendly wrapper around GitHub releases. Paste any repo link and get the downloads, with the matching OS surfaced first.

Domain: `githubdl.com`. Routes: `githubdl.com/{owner}/{repo}` → releases; `…/v/{version}` → version deep-link.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind v4 + shadcn/ui
- Zod 4 — input parsing, route segment validation, GitHub API response shape
- pnpm
- Vercel Pro hosting (Node runtime for pages, Edge for `/og` and proxy)
- `@upstash/redis` + `@upstash/ratelimit` — rate limiter (60 req/60s per IP, sliding window)
- `@vercel/analytics` + `@vercel/speed-insights` — privacy-first analytics, no cookies
- Vitest — pure-function unit tests only

## Architecture

### Data flow

Server-rendered with Next.js Data Cache. Single GitHub PAT (`public_repo` scope, env `GITHUB_TOKEN`).

- Page-1 release lists: `revalidate: 1800` (30 min)
- Deeper paginated pages: `revalidate: 86400` (24 h)
- `/repos/{o}/{r}` repo metadata: `revalidate: 1800`
- `/releases/tags/{tag}`: `revalidate: 86400`

Cache tags: `repo:{owner}/{repo}` and `repo:{owner}/{repo}:p{n}` / `:tag:{t}`. Future on-demand revalidation via `revalidateTag`.

### File map

```
src/
  app/
    layout.tsx                    root layout, fonts, analytics, theme script
    page.tsx                      homepage (hero + form)
    actions.ts                    server action: parse paste → redirect
    repo-link-form.tsx            client form (useActionState)
    [owner]/[repo]/page.tsx       releases list, paginated
    [owner]/[repo]/v/[version]/   version deep-link page (noindex)
    og/route.tsx                  OG image (Edge ImageResponse, no version)
    about|privacy|terms/page.tsx  static legal pages
    robots.ts                     robots.txt generator
  components/
    ui/                           shadcn primitives
    site-footer.tsx
    repo-header.tsx
    release-card.tsx              orchestrates per-release UI
    download-button.tsx           client; fires download_click
    other-downloads.tsx           collapsed section, grouped by OS
    source-code-section.tsx       collapsed; auto-archive URLs
    error-states.tsx              busy/notfound/no-releases/version-notfound
  lib/
    parse-input.ts                Zod schemas + parseRepoInput
    classify-asset.ts             filename → OS + architecture
    detect-os.ts                  User-Agent → OS (ua-parser-js)
    format.ts                     bytes / date helpers
    github/
      schemas.ts                  Zod schemas for GitHub API responses
      client.ts                   fetchRepo / fetchReleases / fetchReleaseByTag
  proxy.ts                        Next.js 16 "proxy" (was middleware) — rate limiter
```

### Routing & validation

Catch-all `[owner]/[repo]` validates against:

- `ownerSchema` (GitHub username regex + reserved-name denylist: `api`, `about`, `privacy`, `terms`, `og`, `_next`, `favicon.ico`, `robots.txt`, `sitemap.xml`)
- `repoSchema` (GitHub repo regex, no `.` or `..`)
- `?page` clamped 1..50; out-of-range → 404
- `versionSchema` (1..255, no control chars)

Invalid → `notFound()`. Reserved owner names → `notFound()`.

### Errors (handled in releases page)

- GitHub 404 → friendly NotFoundState (no private/public distinction; we can't tell)
- GitHub 301 → server-side redirect to new canonical path
- 403/429 with `x-ratelimit-remaining=0` → BusyState
- 5xx → BusyState
- Empty release list → NoReleasesState
- Missing tag on `/v/{version}` → VersionNotFoundState (not auto-redirect)

### UX

Vocabulary mapping (UI is non-technical):

| GitHub | UI label |
|---|---|
| Release | Version |
| Pre-release | Beta badge |
| Asset | Download |
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
- OG image at `/og?owner=…&repo=…` — repo metadata only, no version (cached 24 h)
- `robots.txt` allows root + repo pages, disallows `/api/`, `/og`, `/*?page=`, `/*/v/`
- `/v/{version}` and pages 2+ are `noindex`
- No sitemap (infinite URL space)

### Rate limit & abuse

`src/proxy.ts` runs on every request, gates on Upstash Redis. Local dev without `UPSTASH_REDIS_REST_*` env → no-op (lets through). Verified-bot UA strings (Googlebot, Bingbot, etc.) bypass; full reverse-DNS verification deferred (relies on Vercel Firewall to filter spoofs).

## Decisions worth knowing

- **Hybrid SSR over client-only fetch.** Browser-side calls would scale infinitely (each user gets their own 60/hr GitHub bucket) but loses share-link OG previews. Discord/Slack unfurl is a key UX → server-render.
- **Versions excluded from OG metadata.** Caching is simpler, and Discord caches unfurls anyway.
- **30-min TTL on page 1, 24-hour TTL deeper.** Older releases never change. Sentry alert on `X-RateLimit-Remaining < 500` is the trigger to add an ETag layer if pressure appears (not built in v1).
- **Vercel KV swapped for `@upstash/redis`.** Vercel KV deprecated; underlying provider is the same.
- **No release notes / changelogs.** Audience is non-technical.
- **No version deep-links suppressed from share-link UX.** The mod-maker / forum-distribution use case relies on `/v/{version}` working, even though it's `noindex`.
- **Vercel Pro from day one.** Hobby ToS forbids commercial use; ads are planned.
- **Sentry not yet wired.** Run `pnpm dlx @sentry/wizard@latest -i nextjs` before launch and supply `NEXT_PUBLIC_SENTRY_DSN`. Wizard auto-generates `sentry.{client,server,edge}.config.ts`.

## Build-time gotchas

- **Next.js 16 renamed `middleware` → `proxy`.** File lives at `src/proxy.ts`, exports a function called `proxy` (not `middleware`). The old name still builds but emits a deprecation warning.
- **`@vercel/kv` is deprecated.** Use `@upstash/redis` directly with `Redis.fromEnv()`. The Vercel Marketplace integration auto-injects the env vars.
- **shadcn `init` flags differ from older guides.** Use `-d -t next -b radix --yes --no-monorepo`. There is no `--base-color` flag anymore.
- **Edge runtime disables static generation** for the route — `/og` correctly opts in via `export const runtime = "edge"` and is `(Dynamic)` in build output. Expected.
- **`generateMetadata` and the page receive `params` as a `Promise`** in Next 16 App Router — always `await` before destructuring. Same for `searchParams`.
- **`useActionState` (not `useFormState`)** for the homepage form — React 19 API, `useFormState` is deprecated.

## Caching contract

- **Never put per-request data into the `fetch()` URL or headers** for GitHub calls — would shatter the Data Cache. The token goes in `Authorization` header, fine because it's identical across requests.
- The `redirect: "manual"` on `ghFetch` is intentional — we want to *see* GitHub's 301 and re-emit it as our own redirect to the new canonical path. If you switch to default `redirect: "follow"`, the rename-handling path (`{ kind: "moved" }`) becomes unreachable.
- Cache tags follow `repo:{o}/{r}` and `repo:{o}/{r}:p{n}` / `:tag:{t}`. If we ever wire on-demand revalidation (webhook, manual flush endpoint), use `revalidateTag` with these.

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
pnpm dev          # local dev
pnpm build        # production build
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm test         # vitest run
pnpm test:watch   # vitest --watch
```

Always run `pnpm typecheck && pnpm lint && pnpm test && pnpm build` before declaring work done.

## Env vars

- `GITHUB_TOKEN` (server, required for any production use; without it dev hits the 60/hr unauthenticated bucket per IP)
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (server, optional in dev — rate limiter no-ops without them)
- `NEXT_PUBLIC_SENTRY_DSN` (when Sentry is wired)

## Pre-launch checklist

Full version with detailed steps lives in `NEXT_STEPS.md`. Quick form:

- [ ] Set `GITHUB_TOKEN` in Vercel project env (sensitive, scope `public_repo`)
- [ ] Provision Upstash Redis from Vercel Marketplace; env auto-injected
- [ ] Run Sentry wizard, add DSN env, set `tracesSampleRate: 0.1`
- [ ] Configure `info@githubdl.com` forwarding (ImprovMX)
- [ ] Add `githubdl.com` apex + `www` redirect in Vercel domains
- [ ] Verify Web Analytics + Speed Insights collecting in dashboard
- [ ] Smoke test: `/redis/redis`, `/godotengine/godot`, `/obsidianmd/obsidian`, a known-archived repo, a known-renamed repo, a 404 repo
