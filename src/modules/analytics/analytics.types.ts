/** Данные воронки для диагностики и расчёта конверсий (spec п.5). */
export interface FunnelInput {
  /** Показы. */
  impressions?: number;
  /** Клики. */
  clicks: number;
  /** Заявки. */
  leads: number;
  /** Встречи. */
  meetings?: number;
  /** Сделки / оплаченные заказы. */
  deals: number;
  /** Прирост подписчиков паблика/канала (для диагностики «не подписываются»). */
  subscriberGrowth?: number;
}

/** Данные для расчёта окупаемости и стоимости заказа. */
export interface MarketingInput {
  /** Прибыль. */
  profit: number;
  /** Затраты на маркетинг. */
  marketingCost: number;
  /** Бюджет на трафик. */
  trafficBudget: number;
  /** Оплаченные заказы. */
  paidOrders: number;
}

/**
 * Рассчитанные метрики. null там, где деление на ноль (нет данных) —
 * чтобы не выдавать ложные числа (spec: не придумывать цифры).
 */
export interface MarketingMetrics {
  /** ROMI, % (хороший показатель — от 200%). */
  romi: number | null;
  /** CPO — стоимость оплаченного заказа. */
  cpo: number | null;
  /** CR1 = Заявки / Клики. */
  cr1: number | null;
  /** CR2 = Встречи / Заявки. */
  cr2: number | null;
  /** CR3 = Сделки / Встречи. */
  cr3: number | null;
}

/** Этап-«бутылочное горлышко» воронки (spec п.5). */
export enum BottleneckStage {
  /** Не кликают → проблема в креативе/оффере. */
  NoClicks = 'no_clicks',
  /** Кликают, но нет заявок → не та аудитория или оффер рекламы ≠ офферу лендинга. */
  NoLeads = 'no_leads',
  /** Заявки есть, но не покупают → не та ЦА / продукт / обработка заявок. */
  NoSales = 'no_sales',
  /** Не подписываются → канал не «зазывает» нужную ЦА. */
  NoSubscribers = 'no_subscribers',
  /** Явного горлышка не выявлено. */
  Healthy = 'healthy',
}

export interface BottleneckDiagnosis {
  stage: BottleneckStage;
  hypothesis: string;
}
