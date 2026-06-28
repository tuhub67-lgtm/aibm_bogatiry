import { PublishChannel } from './channel.types';

/**
 * СУТОЧНЫЕ ЛИМИТЫ И ОГРАНИЧЕНИЯ ПЛАТФОРМ (spec п.3).
 *
 * Это НЕ тарифные лимиты подписчика, а ограничения внешних платформ, которые
 * обязаны соблюдать rate-limiter и слой адаптации контента. Конфиг — чтобы
 * очередь/адаптер сверялись с ним, а не «знали» цифры в коде.
 *
 * -1 означает «лимит не зафиксирован/не применяется».
 */
export interface PlatformPostingLimits {
  /** Постов в сутки. */
  postsPerDay: number;
  /** Медиафайлов на один пост. */
  mediaPerPost: number;
  /** Максимальная длина текста, символов. */
  maxTextLength: number;
  /** Лайков/реакций в сутки (для бот-активности). */
  likesPerDay: number;
  notes: string;
}

export const PLATFORM_LIMITS: Readonly<
  Record<PublishChannel, PlatformPostingLimits>
> = {
  telegram: {
    // [TODO: уточнить из доков] точные rate-limit'ы Bot API в spec не заданы.
    postsPerDay: -1,
    mediaPerPost: -1,
    maxTextLength: -1, // [TODO: уточнить из доков] лимит длины сообщения Bot API
    likesPerDay: -1,
    notes:
      'Основной канал MVP. Только официальный Bot API, без MTProto-клиентов и ' +
      'имитации живых пользователей (spec п.3).',
  },
  vk: {
    postsPerDay: 25, // spec: до 25 постов/сутки для бизнес-аккаунтов
    mediaPerPost: 1, // spec: 1 медиафайл на пост
    maxTextLength: -1, // [TODO: уточнить из доков]
    likesPerDay: 500, // spec: лайки до 500/сутки
    notes:
      'Интеграция через готовые SMM-сервисы как прослойку, НЕ через прямой API. ' +
      'С мая 2026 расширенные API-доступы VK не выдаются (spec п.3).',
  },
};
