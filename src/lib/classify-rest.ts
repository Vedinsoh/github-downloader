import { versionSchema } from "./parse-input";

export type RestClassification = { version?: string };

export function classifyRest(rest: string[]): RestClassification {
  if (rest.length === 0) return {};

  const head = rest[0].toLowerCase();

  if (head === "releases" && rest.length >= 3) {
    const sub = rest[1].toLowerCase();
    if (sub === "tag" || sub === "download") {
      const candidate = rest[2];
      if (versionSchema.safeParse(candidate).success) {
        return { version: candidate };
      }
    }
  }

  if (head === "v" && rest.length >= 2) {
    const candidate = rest[1];
    if (versionSchema.safeParse(candidate).success) {
      return { version: candidate };
    }
  }

  return {};
}
