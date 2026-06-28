import { Injectable } from '@nestjs/common';
import {
  BottleneckDiagnosis,
  BottleneckStage,
  FunnelInput,
  MarketingInput,
  MarketingMetrics,
} from './analytics.types';

/**
 * Аналитическое ядро. Формулы и дерево диагностики — строго из spec п.5,
 * без выдуманных коэффициентов. Чистые функции: легко тестируются и не зависят
 * от источника данных (источник метрик — отдельный срез интеграций).
 */
@Injectable()
export class AnalyticsService {
  /** Безопасное деление: null при нулевом знаменателе (нет данных). */
  private ratio(numerator: number, denominator: number): number | null {
    return denominator === 0 ? null : numerator / denominator;
  }

  computeMetrics(
    marketing: MarketingInput,
    funnel: FunnelInput,
  ): MarketingMetrics {
    const romiRatio = this.ratio(marketing.profit, marketing.marketingCost);
    return {
      // ROMI = (Прибыль / Затраты на маркетинг) × 100%
      romi: romiRatio === null ? null : romiRatio * 100,
      // CPO = Бюджет на трафик / Оплаченные заказы
      cpo: this.ratio(marketing.trafficBudget, marketing.paidOrders),
      // CR1 = Заявки / Клики
      cr1: this.ratio(funnel.leads, funnel.clicks),
      // CR2 = Встречи / Заявки
      cr2: this.ratio(funnel.meetings ?? 0, funnel.leads),
      // CR3 = Сделки / Встречи
      cr3:
        funnel.meetings === undefined
          ? null
          : this.ratio(funnel.deals, funnel.meetings),
    };
  }

  /**
   * Диагностика «бутылочного горлышка» — последовательное дерево из spec п.5.
   * Идём от верха воронки: первая «обрывающаяся» ступень и есть проблема.
   */
  diagnoseBottleneck(funnel: FunnelInput): BottleneckDiagnosis {
    if (funnel.clicks === 0) {
      return {
        stage: BottleneckStage.NoClicks,
        hypothesis: 'Не кликают — проблема в креативе или оффере.',
      };
    }
    if (funnel.leads === 0) {
      return {
        stage: BottleneckStage.NoLeads,
        hypothesis:
          'Кликают, но нет заявок — не та аудитория либо оффер рекламы не совпадает с оффером на лендинге.',
      };
    }
    if (funnel.deals === 0) {
      return {
        stage: BottleneckStage.NoSales,
        hypothesis:
          'Заявки есть, но не покупают — не та ЦА, продукт не интересен или плохая обработка заявок.',
      };
    }
    if (funnel.subscriberGrowth !== undefined && funnel.subscriberGrowth <= 0) {
      return {
        stage: BottleneckStage.NoSubscribers,
        hypothesis: 'Не подписываются — канал не «зазывает» нужную ЦА.',
      };
    }
    return {
      stage: BottleneckStage.Healthy,
      hypothesis: 'Явного бутылочного горлышка не выявлено.',
    };
  }
}
