import { Redis } from "@upstash/redis";

export const REDIS_TTL_SECONDS = 60 * 60 * 24 * 7;

export class UnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "UnavailableError";
  }
}

let cached: Redis | null | undefined;

function getRedis(): Redis | null {
  if (cached !== undefined) return cached;
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    cached = Redis.fromEnv();
  } else {
    cached = null;
  }
  return cached;
}

export function isRedisConfigured(): boolean {
  return getRedis() !== null;
}

export async function getJSON<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const value = await redis.get<T>(key);
    if (value === null || value === undefined) return null;
    void redis.expire(key, REDIS_TTL_SECONDS).catch((err) => {
      logRedisWriteFailure(`expire:${key}`, err);
    });
    return value;
  } catch (err) {
    throw new UnavailableError(`Redis read failed for ${key}`, { cause: err });
  }
}

export async function setJSON(key: string, value: unknown, ttlSeconds = REDIS_TTL_SECONDS) {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    if (isOomError(err)) {
      logOom(key, value, err);
    } else {
      logRedisWriteFailure(key, err);
    }
  }
}

export async function delKey(key: string) {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    logRedisWriteFailure(`del:${key}`, err);
  }
}

export async function getRedisInfoMemory(): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  const result = await (redis as unknown as { info: (section: string) => Promise<string> }).info(
    "memory",
  );
  return typeof result === "string" ? result : null;
}

function isOomError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const message = "message" in err ? String((err as { message: unknown }).message ?? "") : "";
  return /OOM|out of memory|maxmemory/i.test(message);
}

function approxSize(value: unknown): number {
  try {
    return JSON.stringify(value).length;
  } catch {
    return -1;
  }
}

function logOom(key: string, value: unknown, err: unknown) {
  // TODO: replace with Sentry.captureException once Sentry is wired.
  console.error("[redis] OOM on SET", { key, sizeBytes: approxSize(value), err });
}

function logRedisWriteFailure(key: string, err: unknown) {
  // TODO: replace with Sentry.captureMessage once Sentry is wired.
  console.warn("[redis] write failed", { key, err });
}

export function repoReleasesKey(owner: string, repo: string): string {
  return `repo:${owner}/${repo}:releases`;
}

export function repoTagsKey(owner: string, repo: string): string {
  return `repo:${owner}/${repo}:tags`;
}
