import { EntitlementService } from './entitlement.service';
import { InMemoryUsageRepository } from './usage/in-memory-usage.repository';
import { Tariff } from './tariff';
import { Feature, LimitKey } from './entitlement.types';
import { Subscription } from './subscription';
import {
  FeatureNotAvailableError,
  LimitExceededError,
} from './entitlement.errors';

describe('EntitlementService', () => {
  let service: EntitlementService;

  beforeEach(() => {
    service = new EntitlementService(new InMemoryUsageRepository());
  });

  const sub = (tariff: Tariff): Subscription => ({ id: `s-${tariff}`, tariff });

  describe('возможности (feature-flags)', () => {
    it('аналитика есть на Богатырском и отсутствует на Лайте', () => {
      expect(service.hasFeature(Tariff.Bogatyr, Feature.Analytics)).toBe(true);
      expect(service.hasFeature(Tariff.Lite, Feature.Analytics)).toBe(false);
    });

    it('assertFeature бросает FeatureNotAvailableError, если фичи нет', () => {
      expect(() =>
        service.assertFeature(sub(Tariff.Lite), Feature.Analytics),
      ).toThrow(FeatureNotAvailableError);
    });

    it('подсказывает, что аналитика доступна только на Богатырском', () => {
      expect(service.tariffsWithFeature(Feature.Analytics)).toEqual([
        Tariff.Bogatyr,
      ]);
    });

    it('конструктор сайтов — только Богатырский (решение заказчика)', () => {
      expect(service.tariffsWithFeature(Feature.SiteBuilder)).toEqual([
        Tariff.Bogatyr,
      ]);
      expect(service.hasFeature(Tariff.Free, Feature.SiteBuilder)).toBe(false);
      expect(service.hasFeature(Tariff.Lite, Feature.SiteBuilder)).toBe(false);
    });

    it('автопостинг входит в Free (с жёстким лимитом)', () => {
      expect(service.hasFeature(Tariff.Free, Feature.Autoposting)).toBe(true);
    });
  });

  describe('лимиты', () => {
    it('Лайт — ровно 1 канал (зафиксировано spec)', () => {
      expect(service.getLimit(Tariff.Lite, LimitKey.ConnectedChannels)).toBe(1);
    });

    it('Богатырский — безлимит на каналы', async () => {
      expect(
        await service.getRemaining(
          sub(Tariff.Bogatyr),
          LimitKey.ConnectedChannels,
        ),
      ).toBe('unlimited');
    });

    it('consume списывает и бросает LimitExceededError при исчерпании', async () => {
      const s = sub(Tariff.Free);
      const allowed = service.getLimit(
        Tariff.Free,
        LimitKey.ContentGenerationsPerMonth,
      );

      for (let i = 0; i < allowed; i++) {
        await service.consume(s, LimitKey.ContentGenerationsPerMonth);
      }

      expect(
        await service.getRemaining(s, LimitKey.ContentGenerationsPerMonth),
      ).toBe(0);

      await expect(
        service.consume(s, LimitKey.ContentGenerationsPerMonth),
      ).rejects.toBeInstanceOf(LimitExceededError);
    });

    it('счётчики использования изолированы между подписками', async () => {
      const a = sub(Tariff.Lite);
      const b: Subscription = { id: 'other', tariff: Tariff.Lite };
      await service.consume(a, LimitKey.ScheduledPostsPerMonth, 5);

      const allowed = service.getLimit(
        Tariff.Lite,
        LimitKey.ScheduledPostsPerMonth,
      );
      expect(
        await service.getRemaining(a, LimitKey.ScheduledPostsPerMonth),
      ).toBe(allowed - 5);
      expect(
        await service.getRemaining(b, LimitKey.ScheduledPostsPerMonth),
      ).toBe(allowed);
    });
  });

  describe('каталог тарифов', () => {
    it('цены зафиксированы spec', () => {
      expect(service.getPlan(Tariff.Free).priceRub).toBe(0);
      expect(service.getPlan(Tariff.Lite).priceRub).toBe(990);
      expect(service.getPlan(Tariff.Bogatyr).priceRub).toBe(1990);
    });

    it('listPlans отдаёт тарифы по возрастанию', () => {
      expect(service.listPlans().map((p) => p.id)).toEqual([
        Tariff.Free,
        Tariff.Lite,
        Tariff.Bogatyr,
      ]);
    });
  });
});
