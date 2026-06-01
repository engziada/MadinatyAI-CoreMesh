/**
 * In-memory rate limit strategy using a sliding window counter.
 * Suitable for single-instance v1 deployments.
 */
import { RateLimitStrategy, RateLimitEntry } from './rate-limit.strategy';

interface Bucket {
  count: number;
  resetAt: number;
}

export class InMemoryRateLimitStrategy implements RateLimitStrategy {
  private readonly buckets = new Map<string, Bucket>();

  async consume(actorKey: string, windowMs: number, maxRequests: number): Promise<RateLimitEntry> {
    const now = Date.now();
    let bucket = this.buckets.get(actorKey);

    // Reset bucket if window expired
    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      this.buckets.set(actorKey, bucket);
    }

    bucket.count++;
    const remaining = Math.max(0, maxRequests - bucket.count);

    return {
      remaining,
      resetAt: bucket.resetAt,
    };
  }

  async reset(actorKey: string): Promise<void> {
    this.buckets.delete(actorKey);
  }

  /** Clear all buckets (for testing). */
  clear(): void {
    this.buckets.clear();
  }
}
