import { scrub, DEFAULT_SCRUB_KEYS, NEVER_SCRUB_KEYS, REDACTED, REDACTED_JWT } from './scrub';

describe('scrub', () => {
  // --- Default denylist keys ---
  it.each([
    ['password'],
    ['passwordHash'],
    ['token'],
    ['accessToken'],
    ['refreshToken'],
    ['jwt'],
    ['bearer'],
    ['authorization'],
    ['apiKey'],
    ['apiSecret'],
    ['hmacSecret'],
    ['keyHash'],
    ['secretHash'],
    ['nationalId'],
    ['idNumber'],
    ['kycPayload'],
    ['email'],
    ['phone'],
    ['phoneNumber'],
    ['instapayHandle'],
    ['iban'],
    ['cardNumber'],
    ['cvv'],
    ['cookie'],
  ])('should redact default key "%s"', (key) => {
    const result = scrub({ [key]: 'secret-value' }) as Record<string, unknown>;
    expect(result[key]).toBe(REDACTED);
  });

  // --- Case insensitivity ---
  it('should redact case-insensitively', () => {
    const result = scrub({ Password: 'secret', TOKEN: 'abc' }) as Record<string, unknown>;
    expect(result.Password).toBe(REDACTED);
    expect(result.TOKEN).toBe(REDACTED);
  });

  // --- Never-scrub keys ---
  it.each([['userId'], ['tenantId'], ['partnerId']])(
    'should NOT redact tracing key "%s"',
    (key) => {
      const result = scrub({ [key]: 'abc-123' }) as Record<string, unknown>;
      expect(result[key]).toBe('abc-123');
    },
  );

  // --- Nested objects ---
  it('should scrub nested objects recursively', () => {
    const input = {
      user: { name: 'Alice', password: 'secret', email: 'a@b.com' },
      safe: 'visible',
    };
    const result = scrub(input) as Record<string, unknown>;
    const user = result.user as Record<string, unknown>;
    expect(user.name).toBe('Alice');
    expect(user.password).toBe(REDACTED);
    expect(user.email).toBe(REDACTED);
    expect(result.safe).toBe('visible');
  });

  // --- JWT regex ---
  it('should redact JWT-like strings with special marker', () => {
    const jwtValue =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHi0vzQ';
    const result = scrub({ token: jwtValue }) as Record<string, unknown>;
    expect(result.token).toBe(REDACTED_JWT);
  });

  // --- Bearer header ---
  it('should redact Bearer token values in authorization', () => {
    const result = scrub({ authorization: 'Bearer abc123def' }) as Record<string, unknown>;
    expect(result.authorization).toBe(`Bearer ${REDACTED}`);
  });

  // --- Non-string values ---
  it('should null non-string sensitive values', () => {
    const result = scrub({ password: 12345 }) as Record<string, unknown>;
    expect(result.password).toBeNull();
  });

  // --- Circular references ---
  it('should handle circular references', () => {
    const obj: Record<string, unknown> = { name: 'test' };
    obj.self = obj;
    const result = scrub(obj) as Record<string, unknown>;
    expect(result.self).toBe('[Circular]');
  });

  // --- Arrays ---
  it('should scrub items inside arrays', () => {
    const input = [{ password: 'a' }, { password: 'b' }];
    const result = scrub(input) as Record<string, unknown>[];
    expect(result[0].password).toBe(REDACTED);
    expect(result[1].password).toBe(REDACTED);
  });

  // --- Extra keys ---
  it('should scrub extra keys provided at call time', () => {
    const result = scrub({ myCustomSecret: 'shh', safe: 'ok' }, ['myCustomSecret']) as Record<
      string,
      unknown
    >;
    expect(result.myCustomSecret).toBe(REDACTED);
    expect(result.safe).toBe('ok');
  });

  // --- Null/undefined passthrough ---
  it('should pass through null and undefined', () => {
    expect(scrub(null)).toBeNull();
    expect(scrub(undefined)).toBeUndefined();
  });

  // --- Primitives passthrough ---
  it('should pass through primitives', () => {
    expect(scrub('hello')).toBe('hello');
    expect(scrub(42)).toBe(42);
    expect(scrub(true)).toBe(true);
  });

  // --- Date/Buffer passthrough ---
  it('should pass through Date and Buffer objects', () => {
    const date = new Date();
    const buf = Buffer.from('test');
    expect(scrub(date)).toBe(date);
    expect(scrub(buf)).toBe(buf);
  });

  // --- Deep nesting ---
  it('should scrub deeply nested sensitive values', () => {
    const input = { level1: { level2: { level3: { password: 'deep' } } } };
    const result = scrub(input) as Record<string, unknown>;
    const l1 = result.level1 as Record<string, unknown>;
    const l2 = l1.level2 as Record<string, unknown>;
    const l3 = l2.level3 as Record<string, unknown>;
    expect(l3.password).toBe(REDACTED);
  });

  // --- Mixed safe and unsafe in same object ---
  it('should preserve safe fields alongside redacted ones', () => {
    const input = { username: 'alice', password: 'secret', role: 'admin' };
    const result = scrub(input) as Record<string, unknown>;
    expect(result.username).toBe('alice');
    expect(result.password).toBe(REDACTED);
    expect(result.role).toBe('admin');
  });
});
