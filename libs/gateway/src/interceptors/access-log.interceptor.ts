/**
 * AccessLogInterceptor — always-on interceptor that emits logger.access()
 * for every HTTP request.
 */
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { LoggerService } from '@madinatyai/logging';

@Injectable()
export class AccessLogInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      url: string;
      ip?: string;
      user?: { id?: string };
    }>();

    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse<{ statusCode: number }>();
          const durationMs = Date.now() - start;
          this.logger.access({
            method,
            path: url,
            status: response.statusCode ?? 200,
            durationMs,
            userId: request.user?.id,
            ip: request.ip,
          });
        },
        error: (err: unknown) => {
          const durationMs = Date.now() - start;
          const status = (err as { getStatus?: () => number })?.getStatus?.() ?? 500;
          this.logger.access({
            method,
            path: url,
            status,
            durationMs,
            userId: request.user?.id,
            ip: request.ip,
          });
        },
      }),
    );
  }
}
