import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { links } from "@/lib/constants/links";
import { Navbar } from "@/components/navbar";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(links.app.url),
  title: {
    default: `${links.app.name} — The easiest way to download GitHub files`,
    template: `%s — ${links.app.name}`,
  },
  description: "Download programs from GitHub the easy way. Paste any repository link.",
  openGraph: {
    siteName: links.app.name,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

const themeScript = `
(function() {
  try {
    var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <Script id="theme-script" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <TooltipProvider>
          <Navbar />
          {children}
        </TooltipProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
