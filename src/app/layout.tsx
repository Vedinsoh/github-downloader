import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css"
import { TooltipProvider } from '@/components/ui/tooltip'

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL("https://githubdl.com"),
  title: {
    default: "githubdl — Get the program. Skip the GitHub maze.",
    template: "%s — githubdl",
  },
  description:
    "Download programs from GitHub the easy way. Paste any repository link.",
  openGraph: {
    siteName: "githubdl",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
}

const themeScript = `
(function() {
  try {
    var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
