/**
 * RateLimitGuard — enforces per-actor rate limits.
 * Actor resolution order: req.user?.role > 'ANONYMOUS'.
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitError } from '../errors/gateway-exception';
import { RateLimitStrategy, RateLimitEntry } from './rate-limit.strategy';
import { InMemoryRateLimitStrategy } from './in-memory-rate-limit.strategy';
import { DEFAULT_TIERS, RateLimitTier } from './rate-limit-tiers';

export const RATE_LIMIT_KEY = 'rateLimit';
export const SkipRateLimit = () => SetMetadata(RATE_LIMIT_KEY, 'skip');

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly strategy: RateLimitStrategy;
  private readonly tiers: Record<string, RateLimitTier>;

  constructor(
    private readonly reflector: Reflector,
    strategy?: RateLimitStrategy,
    tiers?: Record<string, RateLimitTier>,
  ) {
    this.strategy = strategy ?? new InMemoryRateLimitStrategy();
    this.tiers = tiers ?? DEFAULT_TIERS;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.get<string>(RATE_LIMIT_KEY, context.getHandler());
    if (skip === 'skip') return true;

    const request = context.switchToHttp().getRequest<{
      user?: { id?: string; role?: string };
      ip?: string;
    }>();

    // Resolve actor type and key
    const actorType = this.resolveActorType(request);
    const actorKey = this.resolveActorKey(request, actorType);

    const tier = this.tiers[actorType] ?? this.tiers.ANONYMOUS;
    const entry = await this.strategy.consume(actorKey, tier.windowMs, tier.maxRequests);

    // Attach rate limit headers to response
    const response = context.switchToHttp().getResponse<{
      setHeader: (key: string, value: string) => void;
    }>();
    response.setHeader('X-RateLimit-Remaining', String(entry.remaining));
    response.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.remaining <= 0) {
      const retryAfter = Math.ceil((entry.resetAt - Date.now()) / 1000);
      response.setHeader('Retry-After', String(retryAfter));
      throw new RateLimitError(retryAfter);
    }

    return true;
  }

  private resolveActorType(request: { user?: { role?: string } }): string {
    if (request.user?.role) {
      const role = request.user.role.toUpperCase();
      if (role === 'ADMIN' || role === 'PLATFORM_ADMIN') return 'ADMIN';
      if (role === 'BUSINESS') return 'BUSINESS';
      return 'USER';
    }
    return 'ANONYMOUS';
  }

  private resolveActorKey(
    request: { user?: { id?: string }; ip?: string },
    actorType: string,
  ): string {
    if (request.user?.id) return `${actorType}:${request.user.id}`;
    return `${actorType}:${request.ip ?? 'unknown'}`;
  }
}
