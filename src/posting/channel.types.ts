/** Каналы публикации. Приоритет MVP — Telegram (spec п.3). */
export const PUBLISH_CHANNELS = ['telegram', 'vk'] as const;
export type PublishChannel = (typeof PUBLISH_CHANNELS)[number];

/** Исходный пост до адаптации под платформу. */
export interface PostContent {
  text: string;
  /** Ссылки/идентификаторы медиа. */
  media?: string[];
}

/** Контент, адаптированный под конкретную платформу (spec п.3). */
export interface AdaptedContent {
  channel: PublishChannel;
  text: string;
  media: string[];
  /** Что изменено при адаптации — для прозрачности и логов. */
  adjustments: string[];
}

/**
 * Итог по одному каналу:
 *  - published — реально отправлено;
 *  - skipped   — намеренно не отправлено (канал не настроен или, как VK, идёт
 *                через SMM-прослойку, а не прямой API);
 *  - deferred  — упёрлись в суточный лимит платформы, будет повтор;
 *  - failed    — ошибка публикатора.
 */
export type ChannelOutcome = 'published' | 'skipped' | 'deferred' | 'failed';

export interface ChannelResult {
  channel: PublishChannel;
  outcome: ChannelOutcome;
  detail?: string;
}
