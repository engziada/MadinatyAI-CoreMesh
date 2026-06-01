/**
 * Redis rate limit strategy — wired and tested but NOT registered by default.
 * v2 will swap this in via GatewayModule.forRoot({ rateLimitStrategy: new RedisRateLimitStrategy(...) }).
 */
import { RateLimitStrategy, RateLimitEntry } from './rate-limit.strategy';

export class RedisRateLimitStrategy implements RateLimitStrategy {
  // Placeholder — will be implemented when Redis is introduced in v2.
  // The interface contract is defined here so consumers can code against it.

  async consume(actorKey: string, windowMs: number, maxRequests: number): Promise<RateLimitEntry> {
    // In v2, this will use Redis INCR + EXPIRE
    void actorKey;
    void windowMs;
    void maxRequests;
    return { remaining: maxRequests, resetAt: Date.now() + windowMs };
  }

  async reset(actorKey: string): Promise<void> {
    void actorKey;
    // In v2, this will DEL the key
  }
}
