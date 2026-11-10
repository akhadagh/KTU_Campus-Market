const buckets = new Map<string, number[]>();

// In-memory per-instance limiter: effective on a single Node process, a partial
// safeguard on serverless until a shared store (e.g. Redis/KV) is configured.
export function rateLimit(key: string, max: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5_000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return true;
}
