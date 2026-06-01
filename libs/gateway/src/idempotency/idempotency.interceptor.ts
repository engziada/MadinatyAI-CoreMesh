/**
 * IdempotencyInterceptor — replays cached responses for repeated Idempotency-Key headers.
 * Only active on mutating methods (POST, PUT, PATCH).
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { from, Observable, of, switchMap } from 'rxjs';
import { IdempotencyStrategy } from './idempotency.strategy';
import { InMemoryIdempotencyStrategy } from './in-memory-idempotency.strategy';
import { IdempotencyKeyReusedError } from '../errors/gateway-exception';

const IDEMPOTENCY_HEADER = 'idempotency-key';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH']);

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly strategy: IdempotencyStrategy;

  constructor(strategy?: IdempotencyStrategy) {
    this.strategy = strategy ?? new InMemoryIdempotencyStrategy();
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      headers: Record<string, string | undefined>;
    }>();
    const key = request.headers[IDEMPOTENCY_HEADER];

    // Only apply to mutating methods with the header
    if (!key || !MUTATING_METHODS.has(request.method.toUpperCase())) {
      return next.handle();
    }

    // Check for existing record, then proceed or replay
    return from(this.strategy.get(key)).pipe(
      switchMap((existing) => {
        if (existing) {
          // Replay the cached response
          const response = context.switchToHttp().getResponse<{
            status: (code: number) => void;
            json: (body: unknown) => void;
          }>();
          response.status(existing.status);
          response.json(existing.body);
          return of(undefined);
        }

        // No existing record — proceed and cache the result
        return next.handle().pipe(
          switchMap((data) => {
            const response = context.switchToHttp().getResponse<{ statusCode: number }>();
            return from(
              this.strategy.set(key, {
                status: response.statusCode ?? 200,
                body: data,
                createdAt: Date.now(),
              }),
            ).pipe(switchMap(() => of(data)));
          }),
        );
      }),
    );
  }
}
