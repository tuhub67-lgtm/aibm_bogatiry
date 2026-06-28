/**
 * Константы онбординг-квеста. Бизнес-числа — строго из spec, не выдуманы.
 */

/** Ставка SMM-специалиста, ₽/час (spec п.7, шаг 2). */
export const SMM_HOURLY_RATE_RUB = { low: 300, high: 500 } as const;

/** Недель в месяце для пересчёта (spec: 15ч/нед·4·300 = 18 000 ₽/мес). */
export const WEEKS_PER_MONTH = 4;

/** Стоимость альтернатив-«людей», ₽/мес (spec §1). Сравниваем с человеком, не с SaaS. */
export const ALTERNATIVE_COSTS = {
  freelancer: { low: 30_000, high: 50_000 },
  agency: { low: 50_000, high: 150_000 },
} as const;

export interface TrustPrinciple {
  key: string;
  title: string;
  text?: string;
  steps?: string[];
}

/**
 * Блок доверия — обязателен в UX квеста (spec п.7), не опционален.
 */
export const TRUST_BLOCK: ReadonlyArray<TrustPrinciple> = [
  {
    key: 'control',
    title: 'Вы всегда контролируете контент',
    text: 'Редактирование перед публикацией — обязательный шаг, не автопубликация вслепую.',
  },
  {
    key: 'transparency',
    title: 'Как это работает — за 3 шага',
    steps: [
      'Расскажите о бизнесе',
      'Получите варианты-черновики',
      'Отредактируйте и опубликуйте',
    ],
  },
  {
    key: 'data_protection',
    title: 'Данные под защитой',
    text: 'Хранение и обработка — в РФ, соответствие 152-ФЗ, без передачи за рубеж.',
  },
];

/** Оффер триала (шаг 5). Длительность/бонус spec не задаёт. */
export const TRIAL_OFFER = {
  withoutCard: true,
  // [TODO: уточнить у заказчика] длительность триала.
  durationDays: null as number | null,
  // [TODO: уточнить у заказчика] дедлайн/бонус за немедленный старт.
  urgencyNote: '[TODO: уточнить у заказчика] дедлайн/бонус за немедленный старт',
} as const;
