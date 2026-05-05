import { ImageResponse } from "next/og";
import { ownerSchema, repoSchema } from "@/lib/parse-input";
import { fetchRepo } from "@/lib/github/client";
import { links } from "@/lib/constants/links";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const owner = url.searchParams.get("owner") ?? "";
  const repo = url.searchParams.get("repo") ?? "";

  if (!ownerSchema.safeParse(owner).success || !repoSchema.safeParse(repo).success) {
    return fallbackImage("githubdl");
  }

  const r = await fetchRepo(owner, repo);
  if (!r.ok) return fallbackImage(`${owner}/${repo}`);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={r.data.owner.avatar_url}
          alt=""
          width={96}
          height={96}
          style={{ borderRadius: 96 }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 64, fontWeight: 600, color: "#0a0a0a" }}>{r.data.name}</div>
          <div style={{ fontSize: 28, color: "#666" }}>by {r.data.owner.login}</div>
        </div>
      </div>
      {r.data.description ? (
        <div
          style={{
            marginTop: 32,
            fontSize: 28,
            color: "#444",
            lineClamp: 2,
            display: "block",
          }}
        >
          {r.data.description.slice(0, 160)}
        </div>
      ) : null}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 600, color: "#2563eb" }}>{links.app.hostname}</div>
        <div style={{ fontSize: 22, color: "#666" }}>Get the program.</div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
    },
  );
}

function fallbackImage(text: string) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 72,
        color: "#0a0a0a",
        background: "white",
      }}
    >
      {text}
    </div>,
    { width: 1200, height: 630 },
  );
}
