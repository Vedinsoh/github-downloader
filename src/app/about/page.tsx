import type { Metadata } from "next"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: "About",
  alternates: { canonical: "https://githubdl.com/about" },
}

export default function AboutPage() {
  return (
    <>
      <main className="prose mx-auto w-full max-w-3xl flex-1 px-6 py-10 dark:prose-invert">
        <h1>About githubdl</h1>
        <p>
          githubdl is a friendlier interface to GitHub releases. Paste any
          repository link and you&rsquo;ll get the downloads — no clutter, no
          confusion.
        </p>
        <p>
          We don&rsquo;t host any files. Every download link points directly to
          GitHub. We are not affiliated with GitHub.
        </p>
        <p>
          If you have a question or need to report something, email{" "}
          <a href="mailto:info@githubdl.com">info@githubdl.com</a>.
        </p>
      </main>
      <SiteFooter />
    </>
  )
}
