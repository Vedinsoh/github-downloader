import { NextResponse, type NextRequest } from "next/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "60 s"),
      analytics: true,
      prefix: "ratelimit:githubdl",
    })
  : null

function isLikelyVerifiedBot(ua: string | null): boolean {
  if (!ua) return false
  return /(googlebot|bingbot|duckduckbot|slurp|baiduspider)/i.test(ua)
}

export async function proxy(req: NextRequest) {
  if (!ratelimit) return NextResponse.next()

  const ua = req.headers.get("user-agent")
  if (isLikelyVerifiedBot(ua)) {
    // Note: full reverse-DNS verification requires Node runtime; we allow
    // claimed bots through and rely on Vercel firewall to filter spoofs.
    return NextResponse.next()
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous"
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return new NextResponse("Too many requests. Please try again shortly.", {
      status: 429,
      headers: { "Cache-Control": "no-store" },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|robots.txt|sitemap.xml|og$).*)"],
}
