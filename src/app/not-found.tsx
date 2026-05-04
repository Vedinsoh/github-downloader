import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { RepoLinkForm } from "@/components/repo-link-form";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Page not found — githubdl",
  description:
    "We couldn't find that page. Paste a GitHub repo link to get its downloads.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <Navbar showSearch={false} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-20">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Page not found.</h1>
        <p className="text-muted-foreground mt-4 text-lg">
          We couldn&rsquo;t find that page. Paste a GitHub repo link to get its downloads.
        </p>
        <div className="mt-10">
          <RepoLinkForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
