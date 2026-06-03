/**
 * Express/Fastify middleware that creates correlation context per request.
 * Parses traceparent / x-correlation-id; falls back to generated traceparent.
 */
import { Request, Response, NextFunction } from 'express';
import { resolveCorrelationId } from './traceparent';
import { withCorrelation, type CorrelationContext } from './correlation.context';
/**
 * Create a correlation middleware for Express.
 * Resolves the correlation ID from incoming headers and stores it in AsyncLocalStorage.
 */
export function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const headers: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    headers[key] = typeof value === 'string' ? value : undefined;
  }

  const traceParent = resolveCorrelationId(headers);
  const context: CorrelationContext = {
    traceParent,
    correlationId: traceParent.toString(),
  };

  // Set response header so downstream consumers can trace
  res.setHeader('traceparent', context.correlationId);

  withCorrelation(context, () => next());
}

export { CorrelationContext };
