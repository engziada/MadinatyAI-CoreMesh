/**
 * Base GatewayException — all API errors extend this.
 * Produces the standard error envelope shape when thrown.
 */
import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ERROR_CODE_HTTP_STATUS } from './error-codes';

export interface ErrorDetail {
  field?: string;
  rule?: string;
  message?: string;
  [key: string]: unknown;
}

export class GatewayException extends HttpException {
  public readonly code: ErrorCode;
  public readonly details?: ErrorDetail[];

  constructor(code: ErrorCode, message?: string, details?: ErrorDetail[]) {
    const status = ERROR_CODE_HTTP_STATUS[code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const response = {
      success: false,
      error: {
        code,
        message: message ?? code,
        ...(details ? { details } : {}),
      },
    };
    super(response, status);
    this.code = code;
    this.details = details;
  }
}

/** 400 — DTO validation failed. */
export class ValidationError extends GatewayException {
  constructor(message?: string, details?: ErrorDetail[]) {
    super(ErrorCode.VALIDATION_ERROR, message ?? 'Validation failed', details);
  }
}

/** 400 — Malformed but not validation. */
export class BadRequestError extends GatewayException {
  constructor(message?: string) {
    super(ErrorCode.BAD_REQUEST, message ?? 'Bad request');
  }
}

/** 401 — No or invalid auth credential. */
export class UnauthorizedError extends GatewayException {
  constructor(message?: string) {
    super(ErrorCode.UNAUTHORIZED, message ?? 'Unauthorized');
  }
}

/** 403 — Authenticated but lacks permission. */
export class ForbiddenError extends GatewayException {
  constructor(message?: string) {
    super(ErrorCode.FORBIDDEN, message ?? 'Forbidden');
  }
}

/** 404 — Resource missing. */
export class NotFoundError extends GatewayException {
  constructor(message?: string) {
    super(ErrorCode.NOT_FOUND, message ?? 'Not found');
  }
}

/** 405 — HTTP method not supported. */
export class MethodNotAllowedError extends GatewayException {
  constructor(message?: string) {
    super(ErrorCode.METHOD_NOT_ALLOWED, message ?? 'Method not allowed');
  }
}

/** 409 — State conflict. */
export class ConflictError extends GatewayException {
  constructor(message?: string) {
    super(ErrorCode.CONFLICT, message ?? 'Conflict');
  }
}

/** 422 — Semantically invalid. */
export class UnprocessableEntityError extends GatewayException {
  constructor(message?: string) {
    super(ErrorCode.UNPROCESSABLE_ENTITY, message ?? 'Unprocessable entity');
  }
}

/** 429 — Quota exceeded. */
export class RateLimitError extends GatewayException {
  public readonly retryAfterSeconds?: number;

  constructor(retryAfterSeconds?: number) {
    super(ErrorCode.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded');
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** 403 — TrustScore ≤ ban threshold. */
export class InsufficientTrustError extends GatewayException {
  constructor(message?: string) {
    super(ErrorCode.INSUFFICIENT_TRUST, message ?? 'Insufficient trust score');
  }
}

/** 402 — Token wallet underflow. */
export class InsufficientTokensError extends GatewayException {
  constructor(message?: string) {
    super(ErrorCode.INSUFFICIENT_TOKENS, message ?? 'Insufficient tokens');
  }
}

/** 400 — Missing or invalid tenant context. */
export class TenantNotResolvedError extends GatewayException {
  constructor(message?: string) {
    super(ErrorCode.TENANT_NOT_RESOLVED, message ?? 'Tenant not resolved');
  }
}

/** 409 — Same idempotency key with different body. */
export class IdempotencyKeyReusedError extends GatewayException {
  constructor(message?: string) {
    super(
      ErrorCode.IDEMPOTENCY_KEY_REUSED,
      message ?? 'Idempotency key reused with different request',
    );
  }
}

/** 401 — Partner HMAC signature failed (Phase 2+). */
export class HmacInvalidError extends GatewayException {
  constructor(message?: string) {
    super(ErrorCode.HMAC_INVALID, message ?? 'HMAC signature invalid');
  }
}

/** 401 — API key revoked or expired (Phase 2+). */
export class KeyRevokedError extends GatewayException {
  constructor(message?: string) {
    super(ErrorCode.KEY_REVOKED, message ?? 'API key revoked or expired');
  }
}

/** 422 — Action invalid for current state. */
export class WorkflowViolationError extends GatewayException {
  constructor(message?: string) {
    super(ErrorCode.WORKFLOW_VIOLATION, message ?? 'Workflow violation');
  }
}

/** 502 — Upstream failure. */
export class BadGatewayError extends GatewayException {
  constructor(message?: string) {
    super(ErrorCode.BAD_GATEWAY, message ?? 'Bad gateway');
  }
}

/** 503 — Maintenance / overload. */
export class ServiceUnavailableError extends GatewayException {
  constructor(message?: string) {
    super(ErrorCode.SERVICE_UNAVAILABLE, message ?? 'Service unavailable');
  }
}
