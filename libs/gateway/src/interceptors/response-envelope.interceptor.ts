/**
 * Response envelope interceptor — wraps every successful return into
 * { success: true, data, message?, meta: { correlationId, ts, pagination? } }.
 * Controllers should return raw data; this interceptor handles the wrapper.
 */
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { getCorrelationId } from '@madinatyai/logging';

export const PAGINATION_META = 'pagination_meta';

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  message?: string;
  meta: {
    correlationId: string | undefined;
    ts: string;
    pagination?: PaginationMeta;
  };
}

@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<T, SuccessEnvelope<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<SuccessEnvelope<T>> {
    return next.handle().pipe(
      map((data) => {
        // If the controller already returned an envelope, pass through
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        const correlationId = getCorrelationId() || undefined;
        const ts = new Date().toISOString();

        // Check for pagination metadata attached by the controller
        const pagination = this.extractPagination(data);

        // Extract message if present
        let message: string | undefined;
        let actualData = data;
        if (data && typeof data === 'object' && 'message' in data && 'data' in data) {
          message = (data as Record<string, unknown>).message as string;
          actualData = (data as Record<string, unknown>).data as T;
        }

        return {
          success: true,
          data: actualData,
          ...(message ? { message } : {}),
          meta: {
            correlationId,
            ts,
            ...(pagination ? { pagination } : {}),
          },
        };
      }),
    );
  }

  private extractPagination(data: unknown): PaginationMeta | undefined {
    if (data && typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;
      if (
        typeof obj.page === 'number' &&
        typeof obj.limit === 'number' &&
        typeof obj.totalItems === 'number' &&
        typeof obj.totalPages === 'number'
      ) {
        return {
          page: obj.page,
          limit: obj.limit,
          totalItems: obj.totalItems,
          totalPages: obj.totalPages,
        };
      }
      // Check nested _meta or meta
      const meta = (obj._meta ?? obj.meta) as Record<string, unknown> | undefined;
      if (
        meta &&
        typeof meta.page === 'number' &&
        typeof meta.limit === 'number' &&
        typeof meta.totalItems === 'number' &&
        typeof meta.totalPages === 'number'
      ) {
        return {
          page: meta.page,
          limit: meta.limit,
          totalItems: meta.totalItems,
          totalPages: meta.totalPages,
        };
      }
    }
    return undefined;
  }
}
