import { Tariff } from './tariff';

/**
 * Возможности (feature-flags), привязанные к тарифу.
 * Каждый из 4 продуктовых модулей закрыт своим флагом (spec п.8: feature-flag
 * слой по тарифу с первого компонента).
 */
export enum Feature {
  /** Модуль 1 — Конструктор сайтов/лендингов. */
  SiteBuilder = 'site_builder',
  /** Модуль 2 — Генератор контент-стратегий и медиа. */
  ContentGeneration = 'content_generation',
  /** Модуль 3 — AI-автоматизация маркетинга и воронок (боты, прогрев, CRM-логика). */
  MarketingAutomation = 'marketing_automation',
  /** Модуль 3 — Автопостинг в каналы (через очередь с rate-limit). */
  Autoposting = 'autoposting',
  /** Модуль 4 — Аналитика (ROMI/CAC/LTV, воронки, churn). */
  Analytics = 'analytics',
  /** Многоканальность — публикация в несколько каналов одновременно. */
  Multichannel = 'multichannel',
  /** Приоритетная обработка в очередях генерации/публикации. */
  PriorityProcessing = 'priority_processing',
}

/**
 * Числовые лимиты тарифа. Значения — конфигурируемые константы в каталоге,
 * НЕ хардкод в бизнес-логике (spec п.8).
 */
export enum LimitKey {
  /** Сколько AI-генераций контента доступно в расчётном периоде. */
  ContentGenerationsPerMonth = 'content_generations_per_month',
  /** Сколько постов можно запланировать в расчётном периоде. */
  ScheduledPostsPerMonth = 'scheduled_posts_per_month',
  /** Сколько каналов/соцсетей можно подключить. */
  ConnectedChannels = 'connected_channels',
  /** Сколько лендингов можно держать опубликованными. */
  LandingPages = 'landing_pages',
}

/** Сентинел «без лимита». Хранится как -1, чтобы оставаться JSON-чистым. */
export const UNLIMITED = -1;

export function isUnlimited(value: number): boolean {
  return value === UNLIMITED;
}

/** Описание одного тарифа: цена, возможности и лимиты. */
export interface TariffPlan {
  id: Tariff;
  /** Отображаемое имя в богатырской идентике. */
  title: string;
  priceRub: number;
  billingPeriod: 'month';
  /** Короткое позиционирование для карточки тарифа в квесте/лендинге. */
  positioning: string;
  features: ReadonlyArray<Feature>;
  limits: Readonly<Record<LimitKey, number>>;
  /** Приоритет в очередях обработки. */
  priority: boolean;
}
