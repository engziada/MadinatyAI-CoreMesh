import { Env } from './env.validation';

/**
 * Strongly-typed, namespaced configuration object derived from validated env.
 * Registered as the `@nestjs/config` load factory so services can inject
 * `ConfigService` and read `config.get('ai.ollamaBaseUrl')`, etc.
 */
export const configuration = () => {
  const env = process.env as unknown as Env;
  return {
    nodeEnv: env.NODE_ENV,
    port: Number(env.PORT),
    corsOrigins: String(env.CORS_ORIGINS)
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    rootDomain: env.ROOT_DOMAIN,
    database: {
      url: env.DATABASE_URL,
    },
    redis: {
      host: env.REDIS_HOST,
      port: Number(env.REDIS_PORT),
      password: env.REDIS_PASSWORD || undefined,
    },
    ai: {
      ollamaBaseUrl: env.OLLAMA_BASE_URL,
      ollamaModel: env.OLLAMA_MODEL,
      ollamaTimeoutMs: Number(env.OLLAMA_TIMEOUT_MS),
      geminiApiKey: env.GEMINI_API_KEY,
      geminiModel: env.GEMINI_MODEL,
      geminiEmbedModel: env.GEMINI_EMBED_MODEL,
    },
    kyc: {
      encryptionKey: env.KYC_ENCRYPTION_KEY,
      storageDriver: env.KYC_STORAGE_DRIVER,
      storageLocalPath: env.KYC_STORAGE_LOCAL_PATH,
    },
    trustScore: {
      base: Number(env.TRUST_SCORE_BASE),
      banThreshold: Number(env.TRUST_SCORE_BAN_THRESHOLD),
    },
  };
};

export type AppConfig = ReturnType<typeof configuration>;
