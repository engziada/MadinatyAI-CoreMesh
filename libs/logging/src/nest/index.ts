/**
 * NestJS sub-entry for @madinatyai/logging/nest.
 * Provides LoggingModule.forRoot() + LoggerService injectable + NestJS Logger adapter.
 */
export { LoggingModule, LOGGING_CONFIG } from './logging.module';
export { NestLoggerAdapter } from './nest-logger.adapter';
export {
  LoggerService,
  type LoggingConfig,
  type AuditEvent,
  type SecurityEvent,
  type AccessEvent,
} from '../logger.service';
