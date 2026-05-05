import { links } from "@/lib/constants/links";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="text-muted-foreground mx-auto w-full max-w-3xl px-6 py-10 text-sm">
      <div className="mb-2">
        <p>
          Not affiliated with or endorsed by GitHub, Inc. &ldquo;GitHub&rdquo; is a trademark of
          GitHub, Inc.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Link href="/about" className="hover:underline" prefetch={false}>
          About
        </Link>
        <span aria-hidden>·</span>
        <Link href="/privacy" className="hover:underline" prefetch={false}>
          Privacy
        </Link>
        <span aria-hidden>·</span>
        <Link href="/terms" className="hover:underline" prefetch={false}>
          Terms
        </Link>
        <span aria-hidden>·</span>
        <a href={`mailto:${links.app.email}?subject=DMCA%20Complaint`} className="hover:underline">
          DMCA
        </a>
      </div>
    </footer>
  );
}
