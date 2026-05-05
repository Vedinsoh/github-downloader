<p align="center">
  <img src=".github/banner.svg" alt="githubdl.com" width="480">
</p>

<p align="center">
  The easiest way to download apps from GitHub. Paste a repo link, get the download.
</p>

---

## How it works?

Simply add `dl` after `github` in any GitHub repo URL: <br />
<ins>github.com/...</ins> becomes -> <ins>github`dl`.com/...</ins>

Try me! <br />
https://githubdl.com/Vedinsoh/github-downloader

**Or...**

Go to **[githubdl.com](https://githubdl.com)** and paste any GitHub repo link
(e.g. `https://github.com/obsidianmd/obsidian`). You'll land on a clean page
with the right download for your OS surfaced first.

Direct shapes also work:

- `githubdl.com/{owner}/{repo}` — latest releases
- `githubdl.com/{owner}/{repo}/v/{version}` — a specific version
- `githubdl.com/{owner}/{repo}/v/latest` — alias to the latest non-prerelease

## What it does

- Auto-detects your OS from the User-Agent and surfaces the matching download
  as the primary action.
- Groups other-OS downloads in a collapsed section, so they're one click away.
- Hides unnecessary files, surfaces only actual program files.
- Beta toggle (`?beta=show`) for repos where the latest release is a
  pre-release.
- Share-link previews: `/{owner}/{repo}` URLs unfurl with an Open Graph image
  on Discord, Slack, Twitter, etc.

## How it's built

Server-rendered Next.js app deployed to Cloudflare Workers. Releases are
pulled from the GitHub REST and GraphQL APIs, normalized into a small
storage shape, and cached at three layers (a request-scope `unstable_cache`,
a Cloudflare KV blob as the application source-of-truth, and OpenNext's R2
incremental cache). The asset classifier maps filenames to OS + architecture
so the right download lands at the top.

**Stack:**

- [Next.js 16](https://nextjs.org) (App Router) + [React 19](https://react.dev) + TypeScript
- [Tailwind v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [Zod 4](https://zod.dev) for input parsing and API shape validation
- [Cloudflare Workers](https://workers.cloudflare.com) (Paid) via [`@opennextjs/cloudflare`](https://github.com/opennextjs/opennextjs-cloudflare)
- Cloudflare KV (releases blob), R2 (Next cache), D1 (tag cache),
  Durable Objects (revalidation queue), Workers Rate Limiting, Workers
  Analytics Engine
- pnpm, Vitest

The architecture, caching contract, and explicit out-of-scope list live in
[CONTEXT.md](./CONTEXT.md).

## Run it locally

```bash
pnpm install
cp .dev.vars.example .dev.vars   # fill in GITHUB_TOKEN
pnpm dev                         # plain Next.js (no Workers runtime)
pnpm dev:worker                  # full Workers runtime via Miniflare
```

`pnpm dev` is fastest for UI work. KV and the rate limiter no-op in this
mode. Use `pnpm dev:worker` to exercise the Workers bindings end-to-end.

Other commands:

```bash
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint
pnpm test        # vitest run
pnpm build       # next build
```

## Contributing

PRs are welcome. Please:

1. Read [CONTEXT.md](./CONTEXT.md) first — it covers the architecture, the
   caching contract, and the deliberate out-of-scope list (no search bar,
   no accounts, no release notes rendering, etc.).
2. Open an issue before larger changes so we can talk scope.
3. Run `pnpm typecheck && pnpm lint && pnpm test && pnpm build` before
   pushing.

## License

Source-available under the [PolyForm Noncommercial License 1.0.0](./LICENSE).
Personal use, learning, hobby projects, and contributions back are
unambiguously fine. Commercial use requires permission — see the linked
license for details.

---

<sub>githubdl.com is not affiliated with or endorsed by
GitHub, Inc. "GitHub" is a trademark of GitHub, Inc.</sub>
