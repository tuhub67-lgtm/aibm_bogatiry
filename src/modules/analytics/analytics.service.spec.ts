import { AnalyticsService } from './analytics.service';
import { BottleneckStage } from './analytics.types';

describe('AnalyticsService', () => {
  const service = new AnalyticsService();

  describe('computeMetrics', () => {
    it('ROMI = (прибыль / затраты) × 100%', () => {
      const m = service.computeMetrics(
        { profit: 300, marketingCost: 100, trafficBudget: 0, paidOrders: 0 },
        { clicks: 0, leads: 0, deals: 0 },
      );
      expect(m.romi).toBe(300);
    });

    it('CPO = бюджет на трафик / оплаченные заказы', () => {
      const m = service.computeMetrics(
        { profit: 0, marketingCost: 1, trafficBudget: 1000, paidOrders: 10 },
        { clicks: 0, leads: 0, deals: 0 },
      );
      expect(m.cpo).toBe(100);
    });

    it('конверсии CR1/CR2/CR3 считаются по ступеням воронки', () => {
      const m = service.computeMetrics(
        { profit: 0, marketingCost: 1, trafficBudget: 0, paidOrders: 1 },
        { clicks: 100, leads: 25, meetings: 10, deals: 5 },
      );
      expect(m.cr1).toBe(0.25); // 25 / 100
      expect(m.cr2).toBe(0.4); // 10 / 25
      expect(m.cr3).toBe(0.5); // 5 / 10
    });

    it('деление на ноль даёт null, а не выдуманное число', () => {
      const m = service.computeMetrics(
        { profit: 100, marketingCost: 0, trafficBudget: 100, paidOrders: 0 },
        { clicks: 0, leads: 0, deals: 0 },
      );
      expect(m.romi).toBeNull();
      expect(m.cpo).toBeNull();
      expect(m.cr1).toBeNull();
    });
  });

  describe('diagnoseBottleneck (дерево из spec п.5)', () => {
    it('нет кликов → проблема креатива/оффера', () => {
      expect(
        service.diagnoseBottleneck({ clicks: 0, leads: 0, deals: 0 }).stage,
      ).toBe(BottleneckStage.NoClicks);
    });

    it('клики есть, заявок нет → аудитория/несовпадение офферов', () => {
      expect(
        service.diagnoseBottleneck({ clicks: 100, leads: 0, deals: 0 }).stage,
      ).toBe(BottleneckStage.NoLeads);
    });

    it('заявки есть, продаж нет → ЦА/продукт/обработка', () => {
      expect(
        service.diagnoseBottleneck({ clicks: 100, leads: 10, deals: 0 }).stage,
      ).toBe(BottleneckStage.NoSales);
    });

    it('воронка работает, но подписчики не растут', () => {
      expect(
        service.diagnoseBottleneck({
          clicks: 100,
          leads: 10,
          deals: 2,
          subscriberGrowth: 0,
        }).stage,
      ).toBe(BottleneckStage.NoSubscribers);
    });

    it('здоровая воронка', () => {
      expect(
        service.diagnoseBottleneck({
          clicks: 100,
          leads: 10,
          deals: 2,
          subscriberGrowth: 5,
        }).stage,
      ).toBe(BottleneckStage.Healthy);
    });
  });
});
