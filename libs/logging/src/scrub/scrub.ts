/**
 * Pure, side-effect-free sensitive field scrubbing.
 * Recursively walks any logged object and redacts values whose keys
 * match the denylist (case-insensitive).
 */

/** Keys whose values must never appear in log output. */
const DEFAULT_SCRUB_KEYS: ReadonlySet<string> = new Set([
  // Auth
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'jwt',
  'bearer',
  'authorization',
  // API keys (Partner API — future-proof)
  'apikey',
  'apisecret',
  'hmacsecret',
  'keyhash',
  'secrethash',
  'x-api-key',
  'x-api-signature',
  // KYC
  'nationalid',
  'idnumber',
  'kycpayload',
  'encryptedid',
  'idimage',
  // Financial / payment handles (broker stance)
  'instapayhandle',
  'vodafonecashnumber',
  'bankaccount',
  'iban',
  'cardnumber',
  'cvv',
  'cardpan',
  // PII (case-by-case)
  'email',
  'phone',
  'phonenumber',
  'address',
  'gpslocation',
  // Internal
  'webhooksecret',
  'admintoken',
  'cookie',
  'set-cookie',
]);

/** Fields that must NEVER be scrubbed — essential for tracing. */
const NEVER_SCRUB_KEYS: ReadonlySet<string> = new Set(['userid', 'tenantid', 'partnerid']);

/** Regex for values that look like JWTs. */
const JWT_REGEX = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

/** Redacted placeholder for string values. */
const REDACTED = '[REDACTED]';

/** Redacted placeholder for JWT-like strings. */
const REDACTED_JWT = '[REDACTED-JWT]';

/**
 * Scrub a single value. Returns the redacted form or the original.
 */
function scrubValue(key: string, value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    // JWT-like strings
    if (JWT_REGEX.test(value)) return REDACTED_JWT;
    // Bearer prefix
    if (key === 'authorization' && value.toLowerCase().startsWith('bearer ')) {
      return `Bearer ${REDACTED}`;
    }
    return REDACTED;
  }

  // Non-string types: preserve shape with null
  return null;
}

/**
 * Recursively scrub an object, redacting values whose keys match the denylist.
 * Handles circular references via a seen WeakSet.
 */
export function scrub(
  obj: unknown,
  extraKeys?: ReadonlyArray<string>,
  seen?: WeakSet<object>,
): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date || obj instanceof RegExp || obj instanceof Buffer) return obj;

  // Circular reference guard
  const safeSeen = seen ?? new WeakSet<object>();
  if (safeSeen.has(obj as object)) return '[Circular]';
  safeSeen.add(obj as object);

  // Merge extra keys into the denylist for this call
  const denySet = extraKeys
    ? new Set([...DEFAULT_SCRUB_KEYS, ...extraKeys.map((k) => k.toLowerCase())])
    : DEFAULT_SCRUB_KEYS;

  if (Array.isArray(obj)) {
    return obj.map((item) => scrub(item, extraKeys, safeSeen));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Never scrub these
    if (NEVER_SCRUB_KEYS.has(lowerKey)) {
      result[key] = scrub(value, extraKeys, safeSeen);
      continue;
    }

    // Denylist match
    if (denySet.has(lowerKey)) {
      result[key] = scrubValue(lowerKey, value);
      continue;
    }

    // Recurse into nested objects
    if (value !== null && typeof value === 'object') {
      result[key] = scrub(value, extraKeys, safeSeen);
      continue;
    }

    result[key] = value;
  }
  return result;
}

export { DEFAULT_SCRUB_KEYS, NEVER_SCRUB_KEYS, JWT_REGEX, REDACTED, REDACTED_JWT };
