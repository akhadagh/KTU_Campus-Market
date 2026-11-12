/**
 * Rate limiting for a serverless deployment.
 *
 * A shared store (Upstash Redis) is used when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are configured. Without it the limiter falls back
 * to the in-process bucket, which only protects a single instance — this is
 * recorded in the audit as an open risk rather than silently ignored.
 *
 * Sensitive endpoints pass `failClosed: true`: when the shared store cannot be
 * reached the request is refused instead of being allowed through unprotected.
 */

const buckets = new Map<string, number[]>();

export interface RateLimitOptions {
  windowMs?: number;
  /** Refuse the request when the shared limiter is unavailable. */
  failClosed?: boolean;
  /** Identifier used when the caller cannot be identified by IP. */
  scope?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  scope: "shared" | "memory" | "unavailable";
}

interface UpstashResponse {
  result?: number | string | null;
  error?: string;
}

async function upstashLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number } | null> {
  const url = process.env["UPSTASH_REDIS_REST_URL"];
  const token = process.env["UPSTASH_REDIS_REST_TOKEN"];
  if (!url || !token) return null;

  const bucket = Math.floor(Date.now() / windowMs);
  const redisKey = `rl:${key}:${bucket}`;
  try {
    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, Math.ceil(windowMs / 1000) + 1],
      ]),
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as UpstashResponse[];
    const count = Number(payload?.[0]?.result ?? 0);
    if (!Number.isFinite(count)) return null;
    return { allowed: count <= max, remaining: Math.max(0, max - count) };
  } catch {
    return null;
  }
}

export async function rateLimitWith(
  key: string,
  max: number,
  options: RateLimitOptions = {},
): Promise<RateLimitResult> {
  const windowMs = options.windowMs ?? 60_000;

  const shared = await upstashLimit(key, max, windowMs);
  if (shared) {
    return { allowed: shared.allowed, remaining: shared.remaining, limit: max, scope: "shared" };
  }

  if (options.failClosed && isSharedStoreConfigured()) {
    return { allowed: false, remaining: 0, limit: max, scope: "unavailable" };
  }

  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((time) => now - time < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return { allowed: false, remaining: 0, limit: max, scope: "memory" };
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5_000) {
    for (const [bucketKey, values] of buckets) {
      if (values.every((time) => now - time >= windowMs)) buckets.delete(bucketKey);
    }
  }
  return { allowed: true, remaining: max - hits.length, limit: max, scope: "memory" };
}

export function isSharedStoreConfigured(): boolean {
  return Boolean(process.env["UPSTASH_REDIS_REST_URL"] && process.env["UPSTASH_REDIS_REST_TOKEN"]);
}

/**
 * Synchronous helper kept for call sites that have not been migrated yet.
 * It uses the in-process bucket only and is never used for sensitive actions.
 */
export function rateLimit(key: string, max: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((time) => now - time < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5_000) {
    for (const [bucketKey, values] of buckets) {
      if (values.every((time) => now - time >= windowMs)) buckets.delete(bucketKey);
    }
  }
  return true;
}

/**
 * Client IP resolution. Vercel sets x-vercel-forwarded-for / x-real-ip; other
 * proxies set x-forwarded-for. Only the first hop is trusted and the value is
 * validated, so a client cannot spoof an arbitrary address by chaining values.
 */
export function clientIp(request: Request): string {
  const headers = [
    request.headers.get("x-vercel-forwarded-for"),
    request.headers.get("x-real-ip"),
    request.headers.get("x-forwarded-for"),
  ];
  for (const header of headers) {
    if (!header) continue;
    const first = header.split(",")[0]?.trim();
    if (first && /^[0-9a-fA-F:.]{3,45}$/.test(first)) return first;
  }
  return "unknown";
}
