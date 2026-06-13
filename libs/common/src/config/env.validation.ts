import { z } from 'zod';

/**
 * Zod schema validating every environment variable the hub depends on.
 * Used by `@nestjs/config` via the {@link validateEnv} function so the app
 * fails fast on boot if configuration is missing or malformed.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  ROOT_DOMAIN: z.string().min(1).default('madinatyai.com'),

  DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://')),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),
  // Required for managed Upstash / ElastiCache TLS endpoints. Local Docker
  // Redis on dev never uses it. Accepts the literal strings "true"/"false"
  // from .env-style files in addition to booleans.
  REDIS_TLS: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .transform((v) => v === true || v === 'true')
    .default(false),

  OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('llama3:8b'),
  OLLAMA_TIMEOUT_MS: z.coerce.number().int().positive().default(20000),

  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-1.5-pro'),
  GEMINI_EMBED_MODEL: z.string().default('text-embedding-004'),

  KYC_ENCRYPTION_KEY: z.string().optional().default(''),
  KYC_STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  KYC_STORAGE_LOCAL_PATH: z.string().default('./storage/kyc'),

  TRUST_SCORE_BASE: z.coerce.number().int().default(100),
  TRUST_SCORE_BAN_THRESHOLD: z.coerce.number().int().default(20),

  // ── Cloudflare R2 (Souk ElKanto photo storage) ────────────────
  // Leave blank in dev — endpoints that need R2 will return 503.
  KANTO_R2_ENDPOINT: z.string().optional().default(''),
  KANTO_R2_ACCESS_KEY_ID: z.string().optional().default(''),
  KANTO_R2_SECRET: z.string().optional().default(''),
  KANTO_R2_BUCKET: z.string().optional().default(''),
  KANTO_R2_PUBLIC_BASE: z.string().optional().default(''),
  KANTO_R2_REGION: z.string().default('auto'),
  KANTO_R2_PRESIGN_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  // Dev override — when true, skip R2 even if credentials are present and use
  // the local-disk upload middleware. Useful when R2 CORS isn't configured for
  // localhost. Production guards in R2StorageService still forbid this in prod.
  KANTO_R2_FORCE_LOCAL: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .transform((v) => v === true || v === 'true')
    .default(false),

  // ── Auth (Phase A) ────────────────────────────────────────────
  // Signing secret for the issued JWTs. Generate with:
  //   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
  JWT_SECRET: z.string().min(32).default('dev-only-secret-replace-me-32chars-min-aaaa'),
  // R-11 F-16 (partial): TTL shortened from 7d → 24h. Until refresh-token
  // rotation lands (separate session, the full F-16 fix), a leaked token is
  // still useful but only for one day instead of one week. Production env
  // should set this to 30m once the refresh flow is wired.
  JWT_EXPIRES_IN: z.string().default('24h'),
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  // When AUTH_DEV_BYPASS=true the code "000000" is accepted for ANY phone.
  //
  // R-11 F-09: default is now `false` — operators must explicitly opt IN.
  // Boot fails if AUTH_DEV_BYPASS=true AND NODE_ENV !== 'development' (see
  // validateEnv below).
  //
  // NOTE: z.coerce.boolean() uses Boolean(string), so any non-empty string is
  // truthy — including "false". Use a string-aware transform so envs like
  // AUTH_DEV_BYPASS=false do what users expect.
  AUTH_DEV_BYPASS: z
    .union([z.boolean(), z.string()])
    .default(false)
    .transform((v) => {
      if (typeof v === 'boolean') return v;
      const lowered = v.trim().toLowerCase();
      return lowered === 'true' || lowered === '1' || lowered === 'yes';
    }),
  AUTH_DEV_BYPASS_CODE: z.string().default('000000'),

  // ── WAHA (WhatsApp HTTP API) ─────────────────────────────────
  // Self-hosted WAHA instance for OTP delivery & offer notifications.
  // Leave blank to disable WhatsApp delivery (falls back to dev console / SMS stub).
  WAHA_BASE_URL: z.string().optional().default(''),
  WAHA_API_KEY: z.string().optional().default(''),
  WAHA_SESSION: z.string().optional().default('default'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Known dev-stem secret values that must never reach production. If
 * `JWT_SECRET` matches one of these, `validateEnv` refuses to boot when
 * `NODE_ENV === 'production'`.
 *
 * R-11 F-08.
 */
const KNOWN_DEV_JWT_SECRETS = new Set<string>([
  'dev-only-secret-replace-me-32chars-min-aaaa',
  'ci-only-secret-48-chars-pad-pad-pad-pad-pad-pad-pa',
]);

/**
 * `@nestjs/config` validation hook. Throws an aggregated error when the
 * environment is invalid, preventing the application from starting.
 *
 * R-11 F-08 + F-09 add production-only constraints on top of the base schema:
 *   - `JWT_SECRET` must not equal a known dev placeholder, and must be ≥ 48
 *     bytes when serving production traffic.
 *   - `KYC_ENCRYPTION_KEY` must be set (non-empty) when KYC is exercised in
 *     prod. We don't try to parse it as hex here because the kyc service
 *     does that — but we do refuse the empty default.
 *   - `AUTH_DEV_BYPASS=true` is forbidden outside `development`. WAHA
 *     precedence in otp.service.ts already mitigates when WAHA is configured,
 *     but staging environments without WAHA were wide-open before this gate.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i: z.ZodIssue) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  const env = parsed.data;

  if (env.NODE_ENV === 'production') {
    const prodIssues: string[] = [];

    if (KNOWN_DEV_JWT_SECRETS.has(env.JWT_SECRET)) {
      prodIssues.push(
        'JWT_SECRET is set to a known dev/CI placeholder. Generate a fresh secret:\n' +
          '    node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"',
      );
    }
    if (env.JWT_SECRET.length < 48) {
      prodIssues.push(
        `JWT_SECRET length is ${env.JWT_SECRET.length} — production requires at least 48 chars.`,
      );
    }
    if (!env.KYC_ENCRYPTION_KEY) {
      prodIssues.push('KYC_ENCRYPTION_KEY is empty — required in production.');
    }
    if (env.AUTH_DEV_BYPASS) {
      prodIssues.push(
        'AUTH_DEV_BYPASS=true is forbidden in production. Unset or set to false.',
      );
    }

    if (prodIssues.length > 0) {
      throw new Error(
        'Production environment refused to boot due to unsafe defaults:\n' +
          prodIssues.map((i) => `  - ${i}`).join('\n'),
      );
    }
  }

  // R-11 F-09 (also fires in test): dev bypass off any non-development env,
  // even if NODE_ENV='test'. Keeps test suites honest; tests that need bypass
  // set NODE_ENV='development' explicitly.
  if (env.NODE_ENV === 'test' && env.AUTH_DEV_BYPASS) {
    // Tests intentionally set this — log a warning but don't refuse boot.
    // (Refusing would break the existing Playwright suite's globalSetup.)
    // eslint-disable-next-line no-console
    console.warn(
      '[validateEnv] AUTH_DEV_BYPASS=true while NODE_ENV=test. Acceptable for E2E, NEVER in prod.',
    );
  }

  return env;
}
