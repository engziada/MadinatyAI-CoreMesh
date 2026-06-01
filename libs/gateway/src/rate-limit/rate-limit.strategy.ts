/**
 * Rate limit strategy interface.
 * v1 ships in-memory; v2 will swap in Redis.
 */
export interface RateLimitEntry {
  remaining: number;
  resetAt: number;
}

export interface RateLimitStrategy {
  /** Consume one unit for the given actor key. Returns the updated entry. */
  consume(actorKey: string, windowMs: number, maxRequests: number): Promise<RateLimitEntry>;

  /** Reset rate limit for a given actor key. */
  reset(actorKey: string): Promise<void>;
}
