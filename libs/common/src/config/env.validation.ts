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
});

export type Env = z.infer<typeof envSchema>;

/**
 * `@nestjs/config` validation hook. Throws an aggregated error when the
 * environment is invalid, preventing the application from starting.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i: z.ZodIssue) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
