import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { links } from "@/lib/constants/links";

export const metadata: Metadata = {
  title: "Terms",
  alternates: { canonical: `${links.app.url}/terms` },
};

export default function TermsPage() {
  return (
    <>
      <main className="prose dark:prose-invert mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <h1>Terms of Use</h1>
        <p>Last updated: 5 May 2026</p>

        <h2>What this service is</h2>
        <p>
          githubdl is a free, public interface to release information from public GitHub
          repositories. We don&rsquo;t host the files you download. Every download link points
          directly to GitHub. Anything you do with files downloaded through this site is governed by
          GitHub&rsquo;s own terms and the publisher&rsquo;s license.
        </p>

        <h2>No warranty</h2>
        <p>
          The service is provided &ldquo;as is&rdquo; without warranty of any kind, express or
          implied. We don&rsquo;t guarantee that any download is safe, working, free of malware, or
          fit for a particular purpose. You are responsible for verifying anything you download
          before you run it.
        </p>

        <h2>Liability</h2>
        <p>
          To the maximum extent permitted by law, we are not liable for any direct, indirect,
          incidental, or consequential damages arising from your use of the service or any content
          you obtain through it. Files come from third parties.
        </p>

        <h2>Acceptable use</h2>
        <p>
          Don&rsquo;t use the service to abuse our infrastructure (for example, scraping at volume,
          attempting to bypass our rate limits, or using it to mirror GitHub at scale). We
          rate-limit requests and may block traffic that looks abusive.
        </p>

        <h2>Trademark and affiliation</h2>
        <p>
          githubdl is an independent project. It is not affiliated with, endorsed by, or sponsored
          by GitHub, Inc. &ldquo;GitHub&rdquo; is a trademark of GitHub, Inc.
        </p>

        <h2>Reporting and takedowns</h2>
        <p>
          To report content or send a DMCA notice, email{" "}
          <a href={`mailto:${links.app.email}?subject=DMCA%20Complaint`}>{links.app.email}</a>.
          Because we don&rsquo;t host the files themselves, takedowns of file contents are best
          directed at GitHub directly.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms over time. The date at the top reflects the most recent change.
          Continued use of the service after changes are posted constitutes acceptance.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
