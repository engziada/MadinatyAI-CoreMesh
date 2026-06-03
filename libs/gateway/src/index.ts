/**
 * @madinatyai/gateway — unified API surface library for CoreMesh.
 */
export { GatewayModule, type GatewayModuleOptions } from './gateway.module';
export { AllExceptionsFilter } from './filters/all-exceptions.filter';
export {
  ResponseEnvelopeInterceptor,
  type SuccessEnvelope,
  type PaginationMeta,
} from './interceptors/response-envelope.interceptor';
export { AccessLogInterceptor } from './interceptors/access-log.interceptor';
export { AuditLogInterceptor } from './audit/audit-log.interceptor';
export { AuditAction, type AuditActionMetadata } from './audit/audit-action.decorator';
export { RateLimitGuard, SkipRateLimit } from './rate-limit/rate-limit.guard';
export { InMemoryRateLimitStrategy } from './rate-limit/in-memory-rate-limit.strategy';
export { RedisRateLimitStrategy } from './rate-limit/redis-rate-limit.strategy';
export type { RateLimitStrategy, RateLimitEntry } from './rate-limit/rate-limit.strategy';
export {
  DEFAULT_TIERS,
  type RateLimitTier,
  type RateLimitGuardOptions,
} from './rate-limit/rate-limit-tiers';
export { IdempotencyInterceptor } from './idempotency/idempotency.interceptor';
export { InMemoryIdempotencyStrategy } from './idempotency/in-memory-idempotency.strategy';
export type { IdempotencyStrategy, IdempotencyRecord } from './idempotency/idempotency.strategy';
export { Pagination, PageDto, PagedResponse, type PageParams } from './pagination/pagination';
export {
  ErrorCode,
  ERROR_CODE_HTTP_STATUS,
  GatewayException,
  ValidationError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  MethodNotAllowedError,
  ConflictError,
  UnprocessableEntityError,
  RateLimitError,
  InsufficientTrustError,
  InsufficientTokensError,
  TenantNotResolvedError,
  IdempotencyKeyReusedError,
  HmacInvalidError,
  KeyRevokedError,
  WorkflowViolationError,
  BadGatewayError,
  ServiceUnavailableError,
  type ErrorDetail,
} from './errors';
