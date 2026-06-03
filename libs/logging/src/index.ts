/**
 * Main entry point for @madinatyai/logging.
 * Pure logger + scrub + correlation — zero NestJS deps.
 */
export {
  LoggerService,
  type LoggingConfig,
  type AuditEvent,
  type SecurityEvent,
  type AccessEvent,
} from './logger.service';
export { scrub, DEFAULT_SCRUB_KEYS, NEVER_SCRUB_KEYS } from './scrub/scrub';
export {
  resolveCorrelationId,
  parseTraceParent,
  generateTraceParent,
  type TraceParent,
} from './correlation/traceparent';
export {
  withCorrelation,
  getCorrelationContext,
  getCorrelationId,
  type CorrelationContext,
} from './correlation/correlation.context';
export { correlationMiddleware } from './correlation/correlation.middleware';
export { generateLogFilename } from './pino-config';
