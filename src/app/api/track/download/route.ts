import { NextResponse } from "next/server";
import { z } from "zod";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const payloadSchema = z.object({
  repo: z.string().min(1).max(100),
  asset_name: z.string().min(1).max(255),
  os: z.enum(["windows", "mac", "linux", "android", "ios", "unknown"]),
  is_source: z.boolean(),
  mode: z.enum(["archive-primary", "os-build"]),
});

type AnalyticsBinding = {
  writeDataPoint: (event: { blobs?: string[]; doubles?: number[]; indexes?: string[] }) => void;
};

export async function POST(req: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) return new NextResponse(null, { status: 400 });

  try {
    const ctx = getCloudflareContext();
    const analytics = (ctx?.env as { ANALYTICS?: AnalyticsBinding } | undefined)?.ANALYTICS;
    if (analytics) {
      const { repo, asset_name, os, is_source, mode } = parsed.data;
      analytics.writeDataPoint({
        blobs: [repo, asset_name, os, mode, is_source ? "source" : "binary"],
        indexes: [repo],
      });
    }
  } catch {
    // Soft-fail — analytics writes never block the response.
  }

  return new NextResponse(null, { status: 204 });
}
