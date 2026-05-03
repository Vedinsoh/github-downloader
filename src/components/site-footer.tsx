import { links } from "@/lib/constants/links";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="text-muted-foreground mx-auto w-full max-w-3xl px-6 py-10 text-sm">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>Not affiliated with GitHub.</span>
        <Link href="/about" className="hover:underline">
          About
        </Link>
        <span aria-hidden>·</span>
        <Link href="/privacy" className="hover:underline">
          Privacy
        </Link>
        <span aria-hidden>·</span>
        <Link href="/terms" className="hover:underline">
          Terms
        </Link>
        <span aria-hidden>·</span>
        <a href={`mailto:${links.app.email}?subject=DMCA%20Complaint`} className="hover:underline">
          DMCA
        </a>
      </p>
    </footer>
  );
}
