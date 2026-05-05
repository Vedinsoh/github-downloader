# 0001 — Rate limit lives in `src/middleware.ts`, not a custom Worker entry shim

Date: 2026-05-05
Status: Accepted

## Context

We deploy a Next.js 16.2.4 app to Cloudflare Workers via `@opennextjs/cloudflare@1.19.6`. We need edge-side rate limiting (Workers `RateLimit` bindings: `RATE_LIMIT_GENERAL` 60/60s, `RATE_LIMIT_VERSION` 10/60s) and verified-bot bypass (`request.cf.botManagement.verifiedBot`).

Two viable seams to host this gate:

1. **Custom Worker entry shim** (`worker.ts` at repo root) — sets `wrangler.toml` `main = "worker.ts"`, imports the OpenNext-generated handler from `./.open-next/worker.js`, wraps `fetch`, and re-exports OpenNext's Durable Object classes (`DOQueueHandler`, etc.).
2. **Next.js middleware** (`src/middleware.ts`, the legacy filename) — runs inside Next's middleware stage, accesses Workers bindings via `getCloudflareContext()` from `@opennextjs/cloudflare`. Leaves `wrangler.toml` `main = ".open-next/worker.js"` (OpenNext default) untouched.

We initially picked option 1 during planning and built it. First deploy revealed problems and we pivoted to option 2.

## Decision

Use option 2: rate limit + verified-bot bypass live in `src/middleware.ts`.

The legacy `middleware.ts` filename is deliberate — Next 16 renamed `middleware` → `proxy`, but `@opennextjs/cloudflare` does not yet support `proxy.ts` (issue [opennextjs/opennextjs-cloudflare#962](https://github.com/opennextjs/opennextjs-cloudflare/issues/962)), and a separate Next.js production bug ([vercel/next.js#86122](https://github.com/vercel/next.js/issues/86122)) reports `proxy.ts` doesn't execute behind Cloudflare Proxy in production even outside of OpenNext. We use the deprecated-but-supported `middleware.ts` until both issues are resolved.

## Why not the Worker entry shim

The shim broke OpenNext's Durable Object class export chain. With `main = "worker.ts"`, our shim does `import openNextHandler, { DOQueueHandler } from "./.open-next/worker.js"; export { DOQueueHandler };`. workerd's bundle introspection at deploy time produced:

> `A DurableObjectNamespace in the config referenced the class "DOQueueHandler", but no such Durable Object class is exported from the worker. Attempts to call to this Durable Object class will fail at runtime.`

Although workerd's own message says this is a non-fatal warning ("historically this was not a startup-time error"), DO calls would fail at runtime. We use `DOQueueHandler` for OpenNext's revalidation queue, which the planned on-demand refresh feature depends on (`revalidateTag` → DO queue). Shipping with broken DOs would mean discovering this only when on-demand refresh ships.

Re-export through esbuild's bundler can theoretically work, but we do not control OpenNext's generated `worker.js` shape; future OpenNext updates could change the export pattern and silently break the chain again. The shim couples us to an internal contract we don't own.

## Why the Next middleware seam works

- OpenNext explicitly supports legacy `middleware.ts` (https://opennext.js.org/cloudflare lists Middleware as supported, with the caveat that Node-runtime middleware introduced in Next 15.2 is not yet supported — Edge-runtime middleware is what we use).
- `getCloudflareContext().env` is the documented bridge for Workers bindings inside any Next.js call site backed by OpenNext (https://opennext.js.org/cloudflare/bindings). The middleware call site is not explicitly enumerated in OpenNext's docs but is the logical composition of two documented facts (bindings reachable everywhere `env` is reachable; middleware runs inside the Worker).
- `getCloudflareContext()` throws when the Workers runtime is absent (e.g. `next dev`); our middleware catches and returns `NextResponse.next()`, mirroring the `kv.ts` no-op behavior in dev.
- Workers `RateLimit.limit({ key })` is documented as adding "no meaningful latency" (https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) — the Edge vs Node-runtime distinction does not affect availability of the binding.

## Trade-offs accepted

- **Runs after Next routing match, not before OpenNext bootstrap.** The shim approach would run earlier in the request lifecycle (cheaper to reject malicious requests). For this app the difference is ~1 ms per blocked request — negligible. The middleware matcher already excludes `_next/`, static assets, etc., so middleware-vs-shim is small in practice.
- **One undocumented seam.** `getCloudflareContext()` from middleware works empirically but isn't explicitly listed in OpenNext docs. Worst-case failure mode if a future OpenNext version breaks this: bindings return `null`, our try/catch returns `NextResponse.next()`, app keeps serving with rate limiter silently disabled. Safe failure.
- **Deprecation pressure.** Next 16 docs label `middleware.ts` deprecated. We accept the deprecation warning at build time. Once OpenNext supports `proxy.ts` (issue #962) AND vercel/next.js#86122 is resolved, we'll codemod-rename via `npx @next/codemod@canary middleware-to-proxy`.

## Consequences

- `wrangler.toml` `main = ".open-next/worker.js"` (OpenNext default). No custom shim at repo root.
- Rate limit + bot bypass logic centralized in `src/middleware.ts`. CLAUDE.md "Rate limit & abuse" section reflects this.
- Pre-launch checklist requires deploy success + smoke verification that bindings reach the middleware (burst-refresh trips `RATE_LIMIT_GENERAL`).
- Future contributors find rate limiting where they expect it (Next middleware), not in a Worker shim importing a generated bundle.

## References

- [OpenNext Cloudflare middleware support](https://opennext.js.org/cloudflare) — "Middleware" listed as supported feature
- [OpenNext Cloudflare bindings](https://opennext.js.org/cloudflare/bindings) — `getCloudflareContext()` API
- [opennextjs/opennextjs-cloudflare#962](https://github.com/opennextjs/opennextjs-cloudflare/issues/962) — Next 16 `proxy.ts` not yet supported
- [vercel/next.js#86122](https://github.com/vercel/next.js/issues/86122) — `proxy.ts` execution fails behind Cloudflare Proxy
- [Next.js Proxy file convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) — codemod path
- [Cloudflare Workers Rate Limit binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) — `RateLimit.limit()` API
