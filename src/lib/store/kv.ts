import { getCloudflareContext } from "@opennextjs/cloudflare";

export const KV_TTL_SECONDS = 60 * 60 * 24 * 7;

export class UnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "UnavailableError";
  }
}

type KvLike = {
  get<T = unknown>(key: string, type: "json"): Promise<T | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
  delete(key: string): Promise<void>;
};

function getKv(): KvLike | null {
  try {
    const ctx = getCloudflareContext();
    const kv = (ctx?.env as { KV_RELEASES?: KvLike } | undefined)?.KV_RELEASES;
    return kv ?? null;
  } catch {
    return null;
  }
}

export function isKvConfigured(): boolean {
  return getKv() !== null;
}

export async function getJSON<T>(key: string): Promise<T | null> {
  const kv = getKv();
  if (!kv) return null;
  try {
    const value = await kv.get<T>(key, "json");
    return value ?? null;
  } catch (err) {
    throw new UnavailableError(`KV read failed for ${key}`, { cause: err });
  }
}

export async function setJSON(key: string, value: unknown, ttlSeconds = KV_TTL_SECONDS) {
  const kv = getKv();
  if (!kv) return;
  try {
    await kv.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
  } catch (err) {
    logKvWriteFailure(key, err);
  }
}

export async function delKey(key: string) {
  const kv = getKv();
  if (!kv) return;
  try {
    await kv.delete(key);
  } catch (err) {
    logKvWriteFailure(`del:${key}`, err);
  }
}

function logKvWriteFailure(key: string, err: unknown) {
  console.warn("[kv] write failed", { key, err });
}

export function repoReleasesKey(owner: string, repo: string): string {
  return `repo:${owner.toLowerCase()}/${repo.toLowerCase()}:releases`;
}

export function repoTagsKey(owner: string, repo: string): string {
  return `repo:${owner.toLowerCase()}/${repo.toLowerCase()}:tags`;
}

export function repoCacheTag(owner: string, repo: string): string {
  return `repo:${owner.toLowerCase()}/${repo.toLowerCase()}`;
}
