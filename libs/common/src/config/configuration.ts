import { envSchema } from './env.validation';

/**
 * Strongly-typed, namespaced configuration object derived from validated env.
 * Registered as the `@nestjs/config` load factory so services can inject
 * `ConfigService` and read `config.get('ai.ollamaBaseUrl')`, etc.
 */
export const configuration = () => {
  const env = envSchema.parse(process.env);
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
      tls: env.REDIS_TLS,
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
    r2: {
      endpoint: env.KANTO_R2_ENDPOINT,
      accessKeyId: env.KANTO_R2_ACCESS_KEY_ID,
      secret: env.KANTO_R2_SECRET,
      bucket: env.KANTO_R2_BUCKET,
      publicBase: env.KANTO_R2_PUBLIC_BASE,
      region: env.KANTO_R2_REGION,
      presignTtlSeconds: Number(env.KANTO_R2_PRESIGN_TTL_SECONDS),
      forceLocal: env.KANTO_R2_FORCE_LOCAL,
    },
    auth: {
      jwtSecret: env.JWT_SECRET,
      jwtExpiresIn: env.JWT_EXPIRES_IN,
      otpTtlSeconds: Number(env.OTP_TTL_SECONDS),
      otpMaxAttempts: Number(env.OTP_MAX_ATTEMPTS),
      devBypass: env.NODE_ENV !== 'production' && Boolean(env.AUTH_DEV_BYPASS),
      devBypassCode: env.AUTH_DEV_BYPASS_CODE,
    },
    waha: {
      baseUrl: env.WAHA_BASE_URL,
      apiKey: env.WAHA_API_KEY,
      session: env.WAHA_SESSION,
    },
    soukSupportPhone: env.SOUK_SUPPORT_PHONE,
    eventsEnabled: env.EVENTS_ENABLED,
  };
};

export type AppConfig = ReturnType<typeof configuration>;
