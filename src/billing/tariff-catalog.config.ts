import { Tariff } from './tariff';
import {
  Feature,
  LimitKey,
  TariffPlan,
  UNLIMITED,
} from './entitlement.types';

/**
 * КАТАЛОГ ТАРИФОВ — единственный источник правды по возможностям и лимитам.
 * Это конфиг, а не логика: чтобы изменить тариф, правят здесь, а не в коде модулей.
 *
 * Что зафиксировано спецификацией (менять только по явному запросу):
 *   - цены: Free 0 ₽, Лайт 990 ₽/мес, Богатырский 1990 ₽/мес;
 *   - Лайт: контент-генерация, автопостинг, ровно 1 канал;
 *   - Богатырский: аналитика, многоканальность, приоритет.
 *
 * Продуктовые решения заказчика (вне spec, подтверждены явно):
 *   - автопостинг входит в Free, но с жёстким лимитом (10 постов/мес);
 *   - конструктор сайтов/лендингов — ТОЛЬКО Богатырский;
 *   - уровень числовых лимитов — «сбалансированный» (значения ниже).
 */
export const TARIFF_CATALOG: Readonly<Record<Tariff, TariffPlan>> = {
  [Tariff.Free]: {
    id: Tariff.Free,
    title: 'Бесплатный',
    priceRub: 0,
    billingPeriod: 'month',
    positioning: 'Точка входа: попробовать силу без согласований и карты.',
    // Решение заказчика: Free даёт контент-генерацию и автопостинг с жёстким
    // лимитом (даёт «первый трофей» сразу). Конструктор сайтов в Free НЕ входит
    // (только Богатырский). Полный набор автоматизации (боты/воронки) — от Лайта.
    features: [Feature.ContentGeneration, Feature.Autoposting],
    limits: {
      [LimitKey.ContentGenerationsPerMonth]: 10,
      [LimitKey.ScheduledPostsPerMonth]: 10, // жёсткий лимит автопостинга для Free
      [LimitKey.ConnectedChannels]: 1,
      // Конструктор сайтов недоступен на Free → лимит лендингов неактуален.
      [LimitKey.LandingPages]: 0,
    },
    priority: false,
  },

  [Tariff.Lite]: {
    id: Tariff.Lite,
    title: 'Лайт',
    priceRub: 990, // spec
    billingPeriod: 'month',
    positioning: 'В 30–150 раз дешевле SMM-человека за сопоставимый результат.',
    // spec: контент-генерация + автопостинг + 1 канал. Полная автоматизация
    // (боты/воронки/CRM-логика) включена. Конструктор сайтов — решение заказчика:
    // только Богатырский, поэтому в Лайт НЕ входит.
    features: [
      Feature.ContentGeneration,
      Feature.MarketingAutomation,
      Feature.Autoposting,
    ],
    limits: {
      [LimitKey.ContentGenerationsPerMonth]: 100,
      [LimitKey.ScheduledPostsPerMonth]: 100,
      [LimitKey.ConnectedChannels]: 1, // spec: «1 соцсеть/канал»
      // Конструктор сайтов недоступен на Лайте → лимит лендингов неактуален.
      [LimitKey.LandingPages]: 0,
    },
    priority: false,
  },

  [Tariff.Bogatyr]: {
    id: Tariff.Bogatyr,
    title: 'Богатырский',
    priceRub: 1990, // spec
    billingPeriod: 'month',
    positioning: 'Полная дружина: аналитика, многоканальность, приоритет.',
    // spec: полный набор — добавляются аналитика, многоканальность, приоритет.
    features: [
      Feature.SiteBuilder,
      Feature.ContentGeneration,
      Feature.MarketingAutomation,
      Feature.Autoposting,
      Feature.Analytics,
      Feature.Multichannel,
      Feature.PriorityProcessing,
    ],
    limits: {
      [LimitKey.ContentGenerationsPerMonth]: 1000,
      [LimitKey.ScheduledPostsPerMonth]: UNLIMITED,
      [LimitKey.ConnectedChannels]: UNLIMITED, // spec: «многоканальность»
      [LimitKey.LandingPages]: UNLIMITED, // конструктор сайтов — только здесь
    },
    priority: true,
  },
};
