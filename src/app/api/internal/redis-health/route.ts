import { NextResponse, type NextRequest } from "next/server";
import { getRedisInfoMemory } from "@/lib/store/redis";

const FREE_TIER_BYTES = 256 * 1024 * 1024;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected || auth !== `Bearer ${expected}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let info: string | null;
  try {
    info = await getRedisInfoMemory();
  } catch (err) {
    // TODO: replace with Sentry.captureException once Sentry is wired.
    console.error("[redis-health] INFO memory failed", err);
    return NextResponse.json({ ok: false, error: "info_failed" }, { status: 500 });
  }

  if (!info) {
    return NextResponse.json({ ok: false, error: "redis_not_configured" }, { status: 503 });
  }

  const usedMemory = parseUsedMemory(info);
  if (usedMemory === null) {
    return NextResponse.json({ ok: false, error: "parse_failed" }, { status: 500 });
  }

  const cap = FREE_TIER_BYTES;
  const percent = usedMemory / cap;

  // TODO: emit Sentry breadcrumb + Vercel Analytics custom metric (redis.used_memory_pct)
  // once those are wired. For now, just log structured info.
  console.info("[redis-health]", { usedMemory, cap, percent });

  if (percent >= 0.95) {
    console.error("Redis memory critical", { usedMemory, cap, percent });
  } else if (percent >= 0.85) {
    console.warn("Redis memory warning", { usedMemory, cap, percent });
  }

  return NextResponse.json({ ok: true, usedMemory, cap, percent });
}

function parseUsedMemory(info: string): number | null {
  for (const line of info.split(/\r?\n/)) {
    const match = line.match(/^used_memory:(\d+)$/);
    if (match) return Number(match[1]);
  }
  return null;
}
