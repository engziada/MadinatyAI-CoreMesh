/**
 * R-04 regression — configuration() must actually invoke the zod schema so
 * that defaults declared in env.validation.ts apply at runtime.
 *
 * Before this fix, configuration.ts cast process.env directly as Env and the
 * zod .default(...) values silently fell through.
 */

import { configuration } from './configuration';

/**
 * Save/restore process.env around each test so the suite is hermetic.
 * Required keys (no useful default in env.validation.ts) get a minimum-viable
 * value; the test then layers per-case overrides on top.
 */
function withEnv<T>(overrides: Record<string, string | undefined>, fn: () => T): T {
  const baseline = { ...process.env };
  // Wipe everything zod cares about, then layer the test's overrides.
  for (const k of Object.keys(process.env)) {
    delete process.env[k];
  }
  // DATABASE_URL has no default in the schema — supply a minimum-viable value.
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return fn();
  } finally {
    for (const k of Object.keys(process.env)) {
      delete process.env[k];
    }
    Object.assign(process.env, baseline);
  }
}

describe('configuration()', () => {
  describe('zod defaults are actually applied (R-04)', () => {
    // R-11 F-09: schema default flipped from true → false. Operators must opt in.
    it('F-09: AUTH_DEV_BYPASS unset → devBypass=false (was true pre-F-09)', () => {
      const cfg = withEnv({ NODE_ENV: 'development' }, configuration);
      expect(cfg.auth.devBypass).toBe(false);
    });

    it('AUTH_DEV_BYPASS=true in dev → devBypass=true (explicit opt-in)', () => {
      const cfg = withEnv(
        { NODE_ENV: 'development', AUTH_DEV_BYPASS: 'true' },
        configuration,
      );
      expect(cfg.auth.devBypass).toBe(true);
    });

    it('AUTH_DEV_BYPASS=false in dev → devBypass=false', () => {
      const cfg = withEnv(
        { NODE_ENV: 'development', AUTH_DEV_BYPASS: 'false' },
        configuration,
      );
      expect(cfg.auth.devBypass).toBe(false);
    });

    it('NODE_ENV=production with AUTH_DEV_BYPASS unset → devBypass=false', () => {
      // Production-mode requires the full env so validateEnv accepts it.
      // configuration() itself doesn't call validateEnv (it just parses), so
      // this test focuses on the configuration-layer production gate.
      const cfg = withEnv({ NODE_ENV: 'production' }, configuration);
      expect(cfg.auth.devBypass).toBe(false);
    });

    it('OTP_TTL_SECONDS unset → resolves to schema default 300 (not NaN)', () => {
      const cfg = withEnv({}, configuration);
      // The danger of the prior bug: Number(undefined) = NaN
      expect(cfg.auth.otpTtlSeconds).toBe(300);
      expect(Number.isFinite(cfg.auth.otpTtlSeconds)).toBe(true);
    });

    it('OTP_MAX_ATTEMPTS unset → resolves to schema default 5', () => {
      const cfg = withEnv({}, configuration);
      expect(cfg.auth.otpMaxAttempts).toBe(5);
    });

    it('TRUST_SCORE_BASE + BAN_THRESHOLD unset → resolves to schema defaults', () => {
      const cfg = withEnv({}, configuration);
      expect(cfg.trustScore.base).toBe(100);
      expect(cfg.trustScore.banThreshold).toBe(20);
    });

    it('KANTO_R2_PRESIGN_TTL_SECONDS unset → resolves to schema default 300', () => {
      const cfg = withEnv({}, configuration);
      expect(cfg.r2.presignTtlSeconds).toBe(300);
    });

    it('JWT_SECRET unset → resolves to schema fallback (dev-only secret)', () => {
      const cfg = withEnv({}, configuration);
      expect(typeof cfg.auth.jwtSecret).toBe('string');
      expect(cfg.auth.jwtSecret.length).toBeGreaterThanOrEqual(32);
    });

    it('PORT unset → resolves to 3000 (number, not NaN)', () => {
      const cfg = withEnv({}, configuration);
      expect(cfg.port).toBe(3000);
    });
  });

  describe('explicit values override defaults', () => {
    it('AUTH_DEV_BYPASS_CODE override is reflected', () => {
      const cfg = withEnv({ AUTH_DEV_BYPASS_CODE: '123456' }, configuration);
      expect(cfg.auth.devBypassCode).toBe('123456');
    });

    it('CORS_ORIGINS comma-separated string parses into array', () => {
      const cfg = withEnv(
        { CORS_ORIGINS: 'http://a.com,http://b.com,http://c.com' },
        configuration,
      );
      expect(cfg.corsOrigins).toEqual(['http://a.com', 'http://b.com', 'http://c.com']);
    });

    it('WAHA values flow through to waha section', () => {
      const cfg = withEnv(
        {
          WAHA_BASE_URL: 'https://waha.example.com',
          WAHA_API_KEY: 'secret',
          WAHA_SESSION: 'mysession',
        },
        configuration,
      );
      expect(cfg.waha.baseUrl).toBe('https://waha.example.com');
      expect(cfg.waha.apiKey).toBe('secret');
      expect(cfg.waha.session).toBe('mysession');
    });
  });

  describe('schema rejects malformed required vars', () => {
    it('DATABASE_URL malformed → configuration() throws', () => {
      expect(() =>
        withEnv({ DATABASE_URL: 'not a url' }, configuration),
      ).toThrow();
    });
  });
});

/**
 * R-11 F-08 + F-09 — production-only env guards.
 *
 * These tests use the validateEnv() hook directly (not configuration()) so we
 * can assert the production-boot refusal logic in isolation.
 */
describe('validateEnv (R-11 F-08 + F-09)', () => {
  const PROD_OK_INPUT = {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://x:y@db:5432/madinatyai',
    JWT_SECRET: 'production-grade-secret-48-bytes-or-more-padding-pad',
    KYC_ENCRYPTION_KEY: 'a'.repeat(64),
    AUTH_DEV_BYPASS: false,
  };

  // Avoid a hard dependency cycle in the test file by re-importing here.
  let validateEnv: typeof import('./env.validation').validateEnv;
  beforeAll(async () => {
    validateEnv = (await import('./env.validation')).validateEnv;
  });

  it('accepts a well-formed production environment', () => {
    expect(() => validateEnv(PROD_OK_INPUT)).not.toThrow();
  });

  it('F-08: refuses the dev placeholder JWT_SECRET in production', () => {
    expect(() =>
      validateEnv({
        ...PROD_OK_INPUT,
        JWT_SECRET: 'dev-only-secret-replace-me-32chars-min-aaaa',
      }),
    ).toThrow(/dev\/CI placeholder/);
  });

  it('F-08: refuses the CI placeholder JWT_SECRET in production', () => {
    expect(() =>
      validateEnv({
        ...PROD_OK_INPUT,
        JWT_SECRET: 'ci-only-secret-48-chars-pad-pad-pad-pad-pad-pad-pa',
      }),
    ).toThrow(/dev\/CI placeholder/);
  });

  it('F-08: refuses < 48 char JWT_SECRET in production', () => {
    expect(() =>
      validateEnv({
        ...PROD_OK_INPUT,
        JWT_SECRET: 'real-but-too-short-32-chars-pad-padd',
      }),
    ).toThrow(/at least 48/);
  });

  it('F-08: refuses empty KYC_ENCRYPTION_KEY in production', () => {
    expect(() =>
      validateEnv({
        ...PROD_OK_INPUT,
        KYC_ENCRYPTION_KEY: '',
      }),
    ).toThrow(/KYC_ENCRYPTION_KEY is empty/);
  });

  it('F-09: refuses AUTH_DEV_BYPASS=true in production', () => {
    expect(() =>
      validateEnv({
        ...PROD_OK_INPUT,
        AUTH_DEV_BYPASS: true,
      }),
    ).toThrow(/AUTH_DEV_BYPASS=true is forbidden in production/);
  });

  it('F-09: AUTH_DEV_BYPASS unset in production stays false', () => {
    // Removing the field; schema default is now false (was true before R-11 F-09).
    const cfg = validateEnv({
      ...PROD_OK_INPUT,
      AUTH_DEV_BYPASS: undefined,
    } as Record<string, unknown>);
    expect(cfg.AUTH_DEV_BYPASS).toBe(false);
  });

  it('F-09: AUTH_DEV_BYPASS unset in development defaults to false now (was true pre-F-09)', () => {
    const cfg = validateEnv({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://x:y@db:5432/madinatyai',
    });
    expect(cfg.AUTH_DEV_BYPASS).toBe(false);
  });

  it('F-09: AUTH_DEV_BYPASS=true allowed in development', () => {
    const cfg = validateEnv({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://x:y@db:5432/madinatyai',
      AUTH_DEV_BYPASS: 'true',
    });
    expect(cfg.AUTH_DEV_BYPASS).toBe(true);
  });
});
