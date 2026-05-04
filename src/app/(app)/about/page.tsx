import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { links } from "@/lib/constants/links";

export const metadata: Metadata = {
  title: "About",
  alternates: { canonical: `${links.app.url}/about` },
};

export default function AboutPage() {
  return (
    <>
      <main className="prose dark:prose-invert mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <h1>About githubdl</h1>
        <p>
          githubdl is a friendlier interface to GitHub releases. Paste any repository link and
          you&rsquo;ll get the downloads — no clutter, no confusion.
        </p>
        <p>
          We don&rsquo;t host any files. Every download link points directly to GitHub. We are not
          affiliated with GitHub.
        </p>
        <p>
          If you have a question or need to report something, email{" "}
          <a href={`mailto:${links.app.email}`}>{links.app.email}</a>.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
