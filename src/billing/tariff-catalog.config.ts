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
 * Числовые лимиты генераций/постов/лендингов в spec НЕ заданы —
 * выставлены разумные заглушки и помечены [TODO: уточнить у заказчика].
 */
export const TARIFF_CATALOG: Readonly<Record<Tariff, TariffPlan>> = {
  [Tariff.Free]: {
    id: Tariff.Free,
    title: 'Бесплатный',
    priceRub: 0,
    billingPeriod: 'month',
    positioning: 'Точка входа: попробовать силу без согласований и карты.',
    // Точка входа с ограниченным функционалом (spec). Конструктор сайтов и
    // контент-генерация доступны в урезанном виде.
    // [TODO: уточнить у заказчика] входит ли автопостинг в Free — spec упоминает
    // «лимит генераций/постов», но автопостинг заявлен как фича Лайта.
    features: [Feature.SiteBuilder, Feature.ContentGeneration],
    limits: {
      // [TODO: уточнить у заказчика] точные лимиты Free в spec не зафиксированы.
      [LimitKey.ContentGenerationsPerMonth]: 10,
      [LimitKey.ScheduledPostsPerMonth]: 10,
      [LimitKey.ConnectedChannels]: 1,
      [LimitKey.LandingPages]: 1,
    },
    priority: false,
  },

  [Tariff.Lite]: {
    id: Tariff.Lite,
    title: 'Лайт',
    priceRub: 990, // spec
    billingPeriod: 'month',
    positioning: 'В 30–150 раз дешевле SMM-человека за сопоставимый результат.',
    // spec: контент-генерация + автопостинг + 1 канал.
    // [TODO: уточнить у заказчика] входит ли полноценный конструктор сайтов в Лайт
    // (включён по умолчанию как базовая ценность).
    features: [
      Feature.SiteBuilder,
      Feature.ContentGeneration,
      Feature.MarketingAutomation,
      Feature.Autoposting,
    ],
    limits: {
      // [TODO: уточнить у заказчика] числовые лимиты генераций/постов для Лайта.
      [LimitKey.ContentGenerationsPerMonth]: 100,
      [LimitKey.ScheduledPostsPerMonth]: 100,
      [LimitKey.ConnectedChannels]: 1, // spec: «1 соцсеть/канал»
      [LimitKey.LandingPages]: 3, // [TODO: уточнить у заказчика]
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
      // [TODO: уточнить у заказчика] точные лимиты генераций/постов для Богатырского.
      [LimitKey.ContentGenerationsPerMonth]: 1000,
      [LimitKey.ScheduledPostsPerMonth]: UNLIMITED,
      [LimitKey.ConnectedChannels]: UNLIMITED, // spec: «многоканальность»
      [LimitKey.LandingPages]: UNLIMITED,
    },
    priority: true,
  },
};
