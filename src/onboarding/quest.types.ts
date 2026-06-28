/** Мини-бриф бизнеса (шаг 1 «Богатырь, представься»). */
export interface BusinessBrief {
  /** Ниша (салон/кафе/магазин/локальный сервис). */
  niche: string;
  /** Боль/задача. */
  pain: string;
  /** Текущие соцсети/каналы. */
  currentChannels?: string[];
  /** Цель. */
  goal?: string;
  /** Целевая аудитория. */
  audience?: string;
  /** Конкуренты. */
  competitors?: string;
  /** Бюджет, ₽/мес. */
  monthlyBudgetRub?: number;
}

export type QuestStep = 'brief' | 'savings' | 'demo' | 'offer';

/** Результат калькулятора экономии (шаг 2 «Оценка дружины»). */
export interface SavingsEstimate {
  hoursPerWeek: number;
  monthlyHoursSaved: number;
  /** Денежный эквивалент экономии, ₽/мес. */
  moneyEquivalentRub: { low: number; high: number };
  /** Тариф, с которым сравниваем (обычно Богатырский). */
  comparedTariff: { id: string; title: string; priceRub: number };
  /** Во сколько раз дешевле тарифа, чем ручной труд. */
  timesCheaper: { low: number; high: number };
}

export interface QuestSession {
  id: string;
  createdAt: Date;
  brief?: BusinessBrief;
  savings?: SavingsEstimate;
  demoDone: boolean;
  completedSteps: QuestStep[];
}
