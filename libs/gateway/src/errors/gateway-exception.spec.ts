import {
  GatewayException,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  ConflictError,
  RateLimitError,
  InsufficientTokensError,
  InsufficientTrustError,
  TenantNotResolvedError,
  IdempotencyKeyReusedError,
  WorkflowViolationError,
  BadGatewayError,
  ServiceUnavailableError,
} from './gateway-exception';
import { ErrorCode } from './error-codes';

describe('GatewayException', () => {
  it('should produce the correct error envelope shape', () => {
    const ex = new GatewayException(ErrorCode.VALIDATION_ERROR, 'test', [
      { field: 'name', message: 'required' },
    ]);
    const response = ex.getResponse() as Record<string, unknown>;
    expect(response.success).toBe(false);
    expect((response.error as Record<string, unknown>).code).toBe(ErrorCode.VALIDATION_ERROR);
    expect((response.error as Record<string, unknown>).message).toBe('test');
    expect((response.error as Record<string, unknown>).details).toEqual([
      { field: 'name', message: 'required' },
    ]);
    expect(ex.getStatus()).toBe(400);
  });

  it('should default message to the code name', () => {
    const ex = new GatewayException(ErrorCode.NOT_FOUND);
    const response = ex.getResponse() as Record<string, unknown>;
    expect((response.error as Record<string, unknown>).message).toBe(ErrorCode.NOT_FOUND);
  });

  it('ValidationError should map to 400', () => {
    expect(new ValidationError().getStatus()).toBe(400);
    expect(new ValidationError().code).toBe(ErrorCode.VALIDATION_ERROR);
  });

  it('NotFoundError should map to 404', () => {
    expect(new NotFoundError().getStatus()).toBe(404);
  });

  it('ForbiddenError should map to 403', () => {
    expect(new ForbiddenError().getStatus()).toBe(403);
  });

  it('UnauthorizedError should map to 401', () => {
    expect(new UnauthorizedError().getStatus()).toBe(401);
  });

  it('ConflictError should map to 409', () => {
    expect(new ConflictError().getStatus()).toBe(409);
  });

  it('RateLimitError should map to 429 and carry retryAfterSeconds', () => {
    const ex = new RateLimitError(30);
    expect(ex.getStatus()).toBe(429);
    expect(ex.retryAfterSeconds).toBe(30);
  });

  it('InsufficientTokensError should map to 402', () => {
    expect(new InsufficientTokensError().getStatus()).toBe(402);
  });

  it('InsufficientTrustError should map to 403', () => {
    expect(new InsufficientTrustError().getStatus()).toBe(403);
  });

  it('TenantNotResolvedError should map to 400', () => {
    expect(new TenantNotResolvedError().getStatus()).toBe(400);
  });

  it('IdempotencyKeyReusedError should map to 409', () => {
    expect(new IdempotencyKeyReusedError().getStatus()).toBe(409);
  });

  it('WorkflowViolationError should map to 422', () => {
    expect(new WorkflowViolationError().getStatus()).toBe(422);
  });

  it('BadGatewayError should map to 502', () => {
    expect(new BadGatewayError().getStatus()).toBe(502);
  });

  it('ServiceUnavailableError should map to 503', () => {
    expect(new ServiceUnavailableError().getStatus()).toBe(503);
  });
});
