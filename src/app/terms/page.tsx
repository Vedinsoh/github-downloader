import type { Metadata } from "next"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: "Terms",
  alternates: { canonical: "https://githubdl.com/terms" },
}

export default function TermsPage() {
  return (
    <>
      <main className="prose mx-auto w-full max-w-3xl flex-1 px-6 py-10 dark:prose-invert">
        <h1>Terms of Use</h1>
        <p>Last updated: 2026-04-28.</p>

        <h2>What this service is</h2>
        <p>
          githubdl is a free interface to public GitHub repositories. We
          don&rsquo;t host files. All download links point directly to GitHub.
          Use of GitHub-hosted content is governed by GitHub&rsquo;s own terms.
        </p>

        <h2>No warranty</h2>
        <p>
          The service is provided &ldquo;as is&rdquo; without warranty of any
          kind. We don&rsquo;t guarantee that any download is safe, working, or
          fit for purpose. You are responsible for verifying anything you
          download.
        </p>

        <h2>Liability</h2>
        <p>
          We are not liable for any harm caused by content downloaded through
          this site. Files come from third parties.
        </p>

        <h2>Trademark</h2>
        <p>
          GitHub is a trademark of GitHub, Inc. We are not affiliated with,
          endorsed by, or sponsored by GitHub.
        </p>

        <h2>Takedowns</h2>
        <p>
          To report content, email{" "}
          <a href="mailto:info@githubdl.com">info@githubdl.com</a>. Since we
          don&rsquo;t host files, takedowns are usually best directed at GitHub
          directly.
        </p>
      </main>
      <SiteFooter />
    </>
  )
}
