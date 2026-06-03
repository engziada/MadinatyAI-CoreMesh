/**
 * W3C traceparent parser and generator.
 * @see https://www.w3.org/TR/trace-context/
 */

const TRACEPARENT_REGEX = /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;

export interface TraceParent {
  version: string;
  traceId: string;
  parentId: string;
  flags: string;
  /** The full formatted string. */
  toString(): string;
}

/**
 * Parse a traceparent header value. Returns null if invalid.
 */
export function parseTraceParent(header: string): TraceParent | null {
  const match = header.trim().toLowerCase().match(TRACEPARENT_REGEX);
  if (!match) return null;

  const [, version, traceId, parentId, flags] = match;
  // Version 0xff is forbidden
  if (version === 'ff') return null;

  const full = `${version}-${traceId}-${parentId}-${flags}`;
  return {
    version,
    traceId,
    parentId,
    flags,
    toString: () => full,
  };
}

/**
 * Generate a new random traceparent (version 00, sampled flag 01).
 */
export function generateTraceParent(): TraceParent {
  const traceId = randomHex(32);
  const parentId = randomHex(16);
  const flags = '01';
  const full = `00-${traceId}-${parentId}-${flags}`;
  return {
    version: '00',
    traceId,
    parentId,
    flags,
    toString: () => full,
  };
}

/**
 * Resolve the correlation ID from incoming headers.
 * Precedence: traceparent > x-correlation-id > generated.
 */
export function resolveCorrelationId(headers: Record<string, string | undefined>): TraceParent {
  const traceparent = headers['traceparent'];
  if (traceparent) {
    const parsed = parseTraceParent(traceparent);
    if (parsed) return parsed;
  }

  const legacyId = headers['x-correlation-id'];
  if (legacyId) {
    // Embed the legacy ID into a synthetic traceparent for uniform shape
    const traceId = legacyId
      .replace(/[^0-9a-f]/gi, '')
      .padEnd(32, '0')
      .slice(0, 32);
    const parentId = randomHex(16);
    const flags = '01';
    const full = `00-${traceId}-${parentId}-${flags}`;
    return { version: '00', traceId, parentId, flags, toString: () => full };
  }

  return generateTraceParent();
}

function randomHex(length: number): string {
  const bytes = new Uint8Array(length / 2);
  // Use crypto if available (Node 18+)
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // Fallback for older runtimes
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
