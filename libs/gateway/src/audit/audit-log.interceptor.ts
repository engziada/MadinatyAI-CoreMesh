/**
 * AuditLogInterceptor — emits logger.audit() for routes decorated with @AuditAction.
 */
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { LoggerService } from '@madinatyai/logging';
import { AUDIT_ACTION_KEY, AuditActionMetadata } from './audit-action.decorator';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<AuditActionMetadata | undefined>(
      AUDIT_ACTION_KEY,
      context.getHandler(),
    );
    if (!meta) return next.handle();

    const request = context.switchToHttp().getRequest<{
      user?: { id?: string; role?: string };
      params?: Record<string, string>;
    }>();

    const actorId = request.user?.id ?? 'anonymous';
    const actorType = request.user?.role ?? 'ANONYMOUS';
    const targetId = Object.values(request.params ?? {}).join('/') || 'unknown';

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.audit({
            actor: { type: actorType, id: actorId },
            action: meta.action,
            target: { type: meta.target, id: targetId },
            outcome: 'success',
          });
        },
        error: (err: unknown) => {
          this.logger.audit({
            actor: { type: actorType, id: actorId },
            action: meta.action,
            target: { type: meta.target, id: targetId },
            outcome: 'failure',
            reason: err instanceof Error ? err.message : String(err),
          });
        },
      }),
    );
  }
}
