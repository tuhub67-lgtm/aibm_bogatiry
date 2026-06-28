/**
 * Тарифы платформы «Богатырский Буст».
 * Зафиксированы спецификацией (spec п.1), не менять без явного запроса.
 *
 * Бизнес-смысл и цена живут в каталоге (tariff-catalog.config.ts), здесь —
 * только устойчивые идентификаторы, на которые ссылается код и БД.
 */
export enum Tariff {
  /** Бесплатный — 0 ₽. Точка входа, ограниченный функционал. */
  Free = 'free',
  /** Лайт — 990 ₽/мес. Базовый набор: 1 канал, контент-генерация, автопостинг. */
  Lite = 'lite',
  /** Богатырский — 1990 ₽/мес. Полный набор: аналитика, многоканальность, приоритет. */
  Bogatyr = 'bogatyr',
}

/** Упорядоченность тарифов (для подсказок «обновитесь до …» в UX-квесте). */
export const TARIFF_ORDER: ReadonlyArray<Tariff> = [
  Tariff.Free,
  Tariff.Lite,
  Tariff.Bogatyr,
];

export function isTariff(value: unknown): value is Tariff {
  return (
    typeof value === 'string' &&
    (Object.values(Tariff) as string[]).includes(value)
  );
}
