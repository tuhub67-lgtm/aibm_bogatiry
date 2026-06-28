/**
 * Типизированная конфигурация приложения.
 * Читается из провалидированных переменных окружения (см. env.validation.ts).
 */
export interface AppConfig {
  env: string;
  port: number;
  apiPrefix: string;
  databaseUrl?: string;
  redisUrl?: string;
  aiMode: string;
}

export default (): { app: AppConfig } => ({
  app: {
    env: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    apiPrefix: process.env.API_PREFIX ?? 'api',
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    // Режим AI-шлюза: 'gateway' (через 152-ФЗ прослойку) по умолчанию.
    aiMode: process.env.AI_MODE ?? 'gateway',
  },
});
