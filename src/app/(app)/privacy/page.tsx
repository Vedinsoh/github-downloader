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
        <p>Last updated: 5 May 2026</p>

        <p>
          githubdl is built to do as little with your data as possible. We don&rsquo;t use cookies,
          we don&rsquo;t have user accounts, and we don&rsquo;t run third-party advertising or
          tracking scripts.
        </p>

        <h2>What we collect</h2>
        <p>
          <strong>Cloudflare Web Analytics</strong> records cookieless pageviews and basic
          performance metrics (referrer, approximate country, browser type) so we can see how the
          site is being used in aggregate. It does not set cookies, does not fingerprint visitors,
          and does not identify you personally.
        </p>
        <p>
          <strong>Download click events.</strong> When you click a download button, your browser
          sends a small beacon to our server with the repository, the file name, and the operating
          system we surfaced. This is stored in Cloudflare Workers Analytics Engine in aggregate
          form so we can see which downloads are popular. The beacon does not include your IP, your
          identity, or any cookies.
        </p>
        <p>
          <strong>Server logs.</strong> Like any website hosted on Cloudflare, request metadata (IP
          address, user agent, URL path, timestamp) is processed transiently to serve the request
          and is retained according to Cloudflare&rsquo;s standard logging policies.
        </p>
        <p>
          <strong>Rate limiting.</strong> We use your IP address (via the{" "}
          <code>CF-Connecting-IP</code> header) to apply per-visitor rate limits on a sliding
          window. This is legitimate-interest processing for abuse prevention. The IP itself is not
          stored long-term &mdash; only an in-memory counter against the current window.
        </p>

        <h2>What we don&rsquo;t do</h2>
        <ul>
          <li>No user accounts and no login.</li>
          <li>No cookies and no cross-site tracking.</li>
          <li>No fingerprinting.</li>
          <li>No third-party advertising or analytics scripts.</li>
          <li>We do not sell or share your data with anyone.</li>
        </ul>

        <h2>Files you download</h2>
        <p>
          Every download link points directly to GitHub&rsquo;s servers. We never see, proxy, or
          store the contents of any file you download. What happens once you click through is
          governed by GitHub&rsquo;s privacy policy and the publisher of the file.
        </p>

        <h2>GitHub API access</h2>
        <p>
          To fetch public release information, we make authenticated requests to GitHub&rsquo;s REST
          and GraphQL APIs from our server. The token used is held server-side only and never
          reaches your browser. No part of your visit is forwarded to GitHub.
        </p>

        <h2>Your data</h2>
        <p>
          Because we don&rsquo;t store personal data tied to your visit, there&rsquo;s nothing for
          us to look up, export, or delete on request. If you have questions, email{" "}
          <a href={`mailto:${links.app.email}`}>{links.app.email}</a>.
        </p>

        <h2>Changes</h2>
        <p>
          We may update this page as the site evolves (for example, if we add a new analytics
          surface). The date at the top reflects the most recent change.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
