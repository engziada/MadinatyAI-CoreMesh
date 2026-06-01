/**
 * Rate limit tier configuration.
 * Maps actor types to their rate limit parameters.
 */
export interface RateLimitTier {
  windowMs: number;
  maxRequests: number;
}

export const DEFAULT_TIERS: Record<string, RateLimitTier> = {
  ANONYMOUS: { windowMs: 60_000, maxRequests: 30 },
  USER: { windowMs: 60_000, maxRequests: 60 },
  BUSINESS: { windowMs: 60_000, maxRequests: 120 },
  ADMIN: { windowMs: 60_000, maxRequests: 300 },
  INTERNAL: { windowMs: 60_000, maxRequests: 1000 },
};

export interface RateLimitGuardOptions {
  /** Override default tiers. */
  tiers?: Record<string, RateLimitTier>;
  /** Override the strategy (default: InMemoryRateLimitStrategy). */
  strategy?: RateLimitStrategy;
}

import type { RateLimitStrategy } from './rate-limit.strategy';
