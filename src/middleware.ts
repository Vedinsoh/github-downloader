import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const VERSION_PATH = /^\/[^/]+\/[^/]+\/v\//;

type RateLimitBinding = {
  limit: (input: { key: string }) => Promise<{ success: boolean }>;
};

function tooManyRequests(): NextResponse {
  return new NextResponse("Too many requests. Please try again shortly.", {
    status: 429,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  // RSC prefetch requests don't represent real user traffic — Next.js
  // generates one per visible <Link> on hover/viewport. Counting them against
  // the rate limit caused legitimate users to hit 429 after a few refreshes.
  if (req.headers.get("RSC") === "1" || req.headers.get("Next-Router-Prefetch") === "1") {
    return NextResponse.next();
  }

  let env: { RATE_LIMIT_GENERAL?: RateLimitBinding; RATE_LIMIT_VERSION?: RateLimitBinding } = {};
  try {
    env = getCloudflareContext().env as typeof env;
  } catch {
    return NextResponse.next();
  }

  if (!env.RATE_LIMIT_GENERAL) return NextResponse.next();

  const cf = (req as NextRequest & { cf?: { botManagement?: { verifiedBot?: boolean } } }).cf;
  if (cf?.botManagement?.verifiedBot === true) return NextResponse.next();

  const ip = req.headers.get("CF-Connecting-IP") ?? "anonymous";
  const general = await env.RATE_LIMIT_GENERAL.limit({ key: ip });
  if (!general.success) return tooManyRequests();

  if (env.RATE_LIMIT_VERSION && VERSION_PATH.test(req.nextUrl.pathname)) {
    const version = await env.RATE_LIMIT_VERSION.limit({ key: ip });
    if (!version.success) return tooManyRequests();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|robots.txt|sitemap.xml|icon.svg|og$).*)"],
};
