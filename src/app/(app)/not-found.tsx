import type { Metadata } from "next";
import { NotFoundContent } from "@/components/not-found-content";

export const metadata: Metadata = {
  title: "Page not found",
  description:
    "We couldn't find that page. Paste a GitHub repo link to get its downloads.",
  robots: { index: false, follow: false },
};

// Catches notFound() thrown inside the (app) group. The group layout already
// renders <Navbar />, so this boundary must not add its own — the root
// not-found.tsx (which does, for unmatched URLs outside any layout) would
// produce a double navbar here.
export default function NotFound() {
  return <NotFoundContent />;
}
