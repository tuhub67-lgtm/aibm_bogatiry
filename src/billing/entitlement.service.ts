import { Inject, Injectable } from '@nestjs/common';
import { Tariff, TARIFF_ORDER } from './tariff';
import {
  Feature,
  LimitKey,
  TariffPlan,
  isUnlimited,
} from './entitlement.types';
import { TARIFF_CATALOG } from './tariff-catalog.config';
import { Subscription } from './subscription';
import { USAGE_PORT, UsagePort } from './usage/usage.port';
import {
  FeatureNotAvailableError,
  LimitExceededError,
} from './entitlement.errors';

/** Остаток по лимиту: число либо 'unlimited'. */
export type Remaining = number | 'unlimited';

/**
 * Ядро прав доступа. Единственное место, где код спрашивает «можно ли»:
 *   - есть ли у тарифа возможность (feature-flag);
 *   - не исчерпан ли числовой лимит (с учётом фактического использования).
 *
 * Модули не читают каталог напрямую и не считают лимиты сами — только через
 * этот сервис, поэтому смена тарифной политики не задевает их логику.
 */
@Injectable()
export class EntitlementService {
  constructor(@Inject(USAGE_PORT) private readonly usage: UsagePort) {}

  /** План тарифа из каталога. */
  getPlan(tariff: Tariff): TariffPlan {
    return TARIFF_CATALOG[tariff];
  }

  /** Все планы в порядке возрастания (для витрины тарифов в квесте/лендинге). */
  listPlans(): TariffPlan[] {
    return TARIFF_ORDER.map((tariff) => TARIFF_CATALOG[tariff]);
  }

  /** Доступна ли возможность на тарифе. */
  hasFeature(tariff: Tariff, feature: Feature): boolean {
    return this.getPlan(tariff).features.includes(feature);
  }

  /** На каких тарифах есть возможность (для подсказки «доступно на …»). */
  tariffsWithFeature(feature: Feature): Tariff[] {
    return TARIFF_ORDER.filter((tariff) => this.hasFeature(tariff, feature));
  }

  /** Числовое значение лимита тарифа (-1 = без лимита). */
  getLimit(tariff: Tariff, key: LimitKey): number {
    return this.getPlan(tariff).limits[key];
  }

  /** Бросает, если возможности нет в тарифе подписки. */
  assertFeature(subscription: Subscription, feature: Feature): void {
    if (!this.hasFeature(subscription.tariff, feature)) {
      throw new FeatureNotAvailableError(
        feature,
        subscription.tariff,
        this.tariffsWithFeature(feature),
      );
    }
  }

  /** Сколько ещё доступно по лимиту с учётом использования в текущем периоде. */
  async getRemaining(
    subscription: Subscription,
    key: LimitKey,
  ): Promise<Remaining> {
    const allowed = this.getLimit(subscription.tariff, key);
    if (isUnlimited(allowed)) {
      return 'unlimited';
    }
    const used = await this.usage.getUsage(subscription.id, key);
    return Math.max(0, allowed - used);
  }

  /**
   * Бросает, если выполнение запроса на `requested` единиц пробьёт лимит.
   * Только проверка, без списания — для предварительной валидации.
   */
  async assertWithinLimit(
    subscription: Subscription,
    key: LimitKey,
    requested = 1,
  ): Promise<void> {
    const allowed = this.getLimit(subscription.tariff, key);
    if (isUnlimited(allowed)) {
      return;
    }
    const used = await this.usage.getUsage(subscription.id, key);
    if (used + requested > allowed) {
      throw new LimitExceededError(
        key,
        subscription.tariff,
        allowed,
        used,
        requested,
      );
    }
  }

  /**
   * Проверить и списать использование лимита одной операцией.
   * Вызывают модули, выполняющие «расходную» работу (генерация/публикация).
   *
   * [TODO] В проде проверка и инкремент должны быть атомарными на стороне
   * хранилища (например, conditional INCR), чтобы исключить гонки при
   * параллельных запросах. In-memory реализация это не гарантирует.
   */
  async consume(
    subscription: Subscription,
    key: LimitKey,
    amount = 1,
  ): Promise<void> {
    await this.assertWithinLimit(subscription, key, amount);
    await this.usage.increment(subscription.id, key, amount);
  }

  /**
   * Зафиксировать использование без проверки лимита. Для паттерна
   * «проверить → выполнить расходную операцию → списать по факту успеха»:
   * сначала assertWithinLimit, затем сама работа, затем recordUsage — чтобы
   * не списывать квоту за упавшую генерацию/публикацию.
   */
  async recordUsage(
    subscription: Subscription,
    key: LimitKey,
    amount = 1,
  ): Promise<void> {
    await this.usage.increment(subscription.id, key, amount);
  }
}
