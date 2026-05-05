import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { links } from "@/lib/constants/links";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(links.app.url),
  title: {
    default: `${links.app.name} — The easiest way to download GitHub apps`,
    template: `%s — ${links.app.name}`,
  },
  description: "Download programs from GitHub the easy way. Paste any repository link.",
  openGraph: {
    siteName: links.app.name,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

const themeScript = `(function(){try{if(window.matchMedia('(prefers-color-scheme: light)').matches)document.documentElement.classList.remove('dark')}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        {process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN ? (
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN}"}`}
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
