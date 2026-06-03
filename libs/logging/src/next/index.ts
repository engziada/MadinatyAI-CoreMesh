/**
 * Next.js sub-entry for @madinatyai/logging/next.
 * Provides createNextLogger + withCorrelationId route wrapper.
 */
import { LoggerService, type LoggingConfig } from '../logger.service';
import { withCorrelation, type CorrelationContext } from '../correlation/correlation.context';
import { resolveCorrelationId } from '../correlation/traceparent';

/**
 * Create a logger for Next.js API routes.
 * On Vercel (ephemeral filesystem), file streams are no-op; stdout JSON is the only target.
 */
export function createNextLogger(
  config: Omit<LoggingConfig, 'disableFile' | 'disableConsole'>,
): LoggerService {
  const isVercel = !!process.env.VERCEL;
  return new LoggerService({
    ...config,
    disableFile: isVercel,
    disableConsole: false,
  });
}

/**
 * Wrap a Next.js API route handler with correlation context.
 * Parses traceparent from incoming request headers.
 */
export function withCorrelationId<T extends (...args: unknown[]) => unknown>(
  handler: T,
): (req: { headers: Record<string, string | undefined> }, ...args: unknown[]) => ReturnType<T> {
  return (
    req: { headers: Record<string, string | undefined> },
    ...args: unknown[]
  ): ReturnType<T> => {
    const traceParent = resolveCorrelationId(req.headers);
    const context: CorrelationContext = {
      traceParent,
      correlationId: traceParent.toString(),
    };
    return withCorrelation(context, () => handler(req, ...args)) as ReturnType<T>;
  };
}
