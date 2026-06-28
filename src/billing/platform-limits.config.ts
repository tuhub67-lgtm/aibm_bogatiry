/**
 * СУТОЧНЫЕ ЛИМИТЫ ПЛАТФОРМ для автопостинга (spec п.3).
 *
 * Это НЕ тарифные лимиты подписчика, а ограничения внешних платформ,
 * которые обязан соблюдать слой очереди публикаций (rate-limiter). Вынесены в
 * конфиг, чтобы очередь сверялась с ними, а не «знала» цифры в коде.
 *
 * Сам слой очереди — отдельный срез (queue + rate-limiter), здесь только
 * справочные константы, чтобы архитектура закладывала лимиты с первого дня.
 */
export interface PlatformPostingLimits {
  platform: string;
  /** Постов в сутки. UNLIMITED-аналог отсутствует: -1 = не зафиксировано. */
  postsPerDay: number;
  /** Медиафайлов на один пост. */
  mediaPerPost: number;
  /** Лайков/реакций в сутки (для бот-активности). */
  likesPerDay: number;
  notes: string;
}

export const PLATFORM_LIMITS: Readonly<Record<string, PlatformPostingLimits>> = {
  telegram: {
    platform: 'telegram',
    // [TODO: уточнить у заказчика] точные rate-limit'ы Bot API в spec не заданы.
    // Закладываем как конфиг; реальные значения уточнить из docs Telegram.
    postsPerDay: -1,
    mediaPerPost: -1,
    likesPerDay: -1,
    notes:
      'Основной канал MVP. Только официальный Bot API, без MTProto-клиентов и ' +
      'имитации живых пользователей (spec п.3).',
  },
  vk: {
    platform: 'vk',
    postsPerDay: 25, // spec: до 25 постов/сутки для бизнес-аккаунтов
    mediaPerPost: 1, // spec: 1 медиафайл на пост
    likesPerDay: 500, // spec: лайки до 500/сутки
    notes:
      'Интеграция через готовые SMM-сервисы как прослойку, НЕ через прямой API. ' +
      'С мая 2026 расширенные API-доступы VK не выдаются (spec п.3).',
  },
};
