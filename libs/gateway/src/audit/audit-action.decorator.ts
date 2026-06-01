/**
 * @AuditAction decorator — marks a route for audit logging.
 * The AuditLogInterceptor reads this metadata and emits logger.audit().
 */
import { SetMetadata } from '@nestjs/common';

export interface AuditActionMetadata {
  action: string;
  target: string;
}

export const AUDIT_ACTION_KEY = 'audit_action';
export const AuditAction = (meta: AuditActionMetadata) =>
  SetMetadata(AUDIT_ACTION_KEY, meta);
