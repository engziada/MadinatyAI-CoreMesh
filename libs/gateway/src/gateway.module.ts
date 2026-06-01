/**
 * GatewayModule — registers all gateway primitives globally.
 * Usage: GatewayModule.forRoot({ service: 'core-hub', ... })
 */
import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { LoggerService, type LoggingConfig } from '@madinatyai/logging';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from './interceptors/response-envelope.interceptor';
import { AccessLogInterceptor } from './interceptors/access-log.interceptor';
import { AuditLogInterceptor } from './audit/audit-log.interceptor';
import { RateLimitGuard } from './rate-limit/rate-limit.guard';
import { IdempotencyInterceptor } from './idempotency/idempotency.interceptor';
import { InMemoryRateLimitStrategy } from './rate-limit/in-memory-rate-limit.strategy';
import { InMemoryIdempotencyStrategy } from './idempotency/in-memory-idempotency.strategy';
import type { RateLimitStrategy } from './rate-limit/rate-limit.strategy';
import type { IdempotencyStrategy } from './idempotency/idempotency.strategy';
import type { RateLimitGuardOptions } from './rate-limit/rate-limit-tiers';

export interface GatewayModuleOptions {
  /** Logging config — used to create the LoggerService. */
  logging: LoggingConfig;
  /** Rate limit options. */
  rateLimit?: RateLimitGuardOptions;
  /** Custom idempotency strategy (default: in-memory). */
  idempotencyStrategy?: IdempotencyStrategy;
}

@Global()
@Module({})
export class GatewayModule {
  static forRoot(options: GatewayModuleOptions): DynamicModule {
    const loggerServiceProvider: Provider = {
      provide: LoggerService,
      useFactory: () => new LoggerService(options.logging),
    };

    const rateLimitStrategyProvider: Provider = {
      provide: 'RATE_LIMIT_STRATEGY',
      useFactory: () => options.rateLimit?.strategy ?? new InMemoryRateLimitStrategy(),
    };

    const idempotencyStrategyProvider: Provider = {
      provide: 'IDEMPOTENCY_STRATEGY',
      useFactory: () => options.idempotencyStrategy ?? new InMemoryIdempotencyStrategy(),
    };

    return {
      module: GatewayModule,
      providers: [
        loggerServiceProvider,
        rateLimitStrategyProvider,
        idempotencyStrategyProvider,
        AllExceptionsFilter,
        ResponseEnvelopeInterceptor,
        AccessLogInterceptor,
        AuditLogInterceptor,
        RateLimitGuard,
        IdempotencyInterceptor,
      ],
      exports: [
        LoggerService,
        AllExceptionsFilter,
        ResponseEnvelopeInterceptor,
        AccessLogInterceptor,
        AuditLogInterceptor,
        RateLimitGuard,
        IdempotencyInterceptor,
      ],
    };
  }
}
