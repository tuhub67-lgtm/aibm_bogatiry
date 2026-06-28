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
}

export interface AiConfig {
  /** Режим: 'gateway' (через 152-ФЗ прослойку) | 'direct' (для dev). */
  mode: string;
  /** URL AI-шлюза (KodikRouter / ITGLOBAL AIaaS). Пусто → локальный фолбэк. */
  gatewayUrl?: string;
  gatewayApiKey?: string;
}

export interface ChannelsConfig {
  /** Токен Telegram-бота. Пусто → публикация в Telegram пропускается. */
  telegramBotToken?: string;
  /** Dev: chat_id целевого канала (до появления привязки каналов пользователя). */
  telegramDefaultChatId?: string;
}

export default (): {
  app: AppConfig;
  ai: AiConfig;
  channels: ChannelsConfig;
} => ({
  app: {
    env: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    apiPrefix: process.env.API_PREFIX ?? 'api',
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
  },
  ai: {
    mode: process.env.AI_MODE ?? 'gateway',
    // Пустые строки приводим к undefined, чтобы фабрика выбирала фолбэк.
    gatewayUrl: process.env.AI_GATEWAY_URL || undefined,
    gatewayApiKey: process.env.AI_GATEWAY_API_KEY || undefined,
  },
  channels: {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || undefined,
    telegramDefaultChatId: process.env.TELEGRAM_DEFAULT_CHAT_ID || undefined,
  },
});
