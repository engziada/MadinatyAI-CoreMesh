/**
 * Global exception filter producing the standard error envelope.
 * Converts every throw (including standard HttpException) into the
 * { success: false, error: { code, message, details? }, meta } shape.
 */
import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ErrorCode } from '../errors/error-codes';
import { GatewayException } from '../errors/gateway-exception';
import { getCorrelationId } from '@madinatyai/logging';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let code: ErrorCode;
    let message: string;
    let details: unknown[] | undefined;

    if (exception instanceof GatewayException) {
      status = exception.getStatus();
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const excResponse = exception.getResponse();
      // Map standard Nest exceptions to gateway error codes
      code = this.nestStatusToErrorCode(status);
      if (typeof excResponse === 'string') {
        message = excResponse;
      } else if (typeof excResponse === 'object' && excResponse !== null) {
        const obj = excResponse as Record<string, unknown>;
        message = (obj.message as string) ?? exception.message;
        if (Array.isArray(obj.message)) {
          // ValidationPipe produces array of messages
          details = (obj.message as string[]).map((m) => ({ message: m }));
          message = 'Validation failed';
        }
      } else {
        message = exception.message;
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = ErrorCode.INTERNAL_ERROR;
      message = 'Internal server error';
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status} [${code}]`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const correlationId = getCorrelationId() || undefined;

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
      meta: {
        correlationId,
        ts: new Date().toISOString(),
      },
    });
  }

  private nestStatusToErrorCode(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_ERROR;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.METHOD_NOT_ALLOWED:
        return ErrorCode.METHOD_NOT_ALLOWED;
      case HttpStatus.CONFLICT:
        return ErrorCode.CONFLICT;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ErrorCode.UNPROCESSABLE_ENTITY;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMIT_EXCEEDED;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }
}
