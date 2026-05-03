import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { links } from "@/lib/constants/links";

export const metadata: Metadata = {
  title: "Privacy",
  alternates: { canonical: `${links.app.url}/privacy` },
};

export default function PrivacyPage() {
  return (
    <>
      <main className="prose dark:prose-invert mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <h1>Privacy</h1>
        <p>Last updated: 2026-04-28.</p>

        <h2>What we collect</h2>
        <p>
          We use Vercel Web Analytics and Vercel Speed Insights to understand aggregate traffic.
          These tools do not use cookies and do not collect personal data. We see counts of
          pageviews, referrers, and approximate location at the country level.
        </p>
        <p>
          We use Sentry to monitor errors. When something breaks, Sentry stores the URL path,
          browser type, and a stack trace for up to 90 days so we can fix it.
        </p>

        <h2>What we don&rsquo;t collect</h2>
        <p>
          We don&rsquo;t store any user accounts. We don&rsquo;t sell or share data. We don&rsquo;t
          fingerprint visitors.
        </p>

        <h2>Files</h2>
        <p>Downloads come directly from GitHub. We never see, proxy, or store file contents.</p>

        <h2>Your data</h2>
        <p>
          Since we don&rsquo;t store personal data, there&rsquo;s nothing to delete on request. If
          you have questions, email <a href={`mailto:${links.app.email}`}>{links.app.email}</a>.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
