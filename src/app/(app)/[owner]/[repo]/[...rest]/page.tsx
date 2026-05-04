import { notFound, permanentRedirect } from "next/navigation";
import { ownerSchema, repoSchema } from "@/lib/parse-input";
import { classifyRest } from "@/lib/classify-rest";

type Params = { owner: string; repo: string; rest: string[] };

export default async function CatchAllRedirect({ params }: { params: Promise<Params> }) {
  const { owner, repo, rest } = await params;

  if (!ownerSchema.safeParse(owner).success || !repoSchema.safeParse(repo).success) {
    notFound();
  }

  const { version } = classifyRest(rest);
  const target = version
    ? `/${owner}/${repo}/v/${encodeURIComponent(version)}`
    : `/${owner}/${repo}`;

  permanentRedirect(target);
}
