import { Injectable } from '@nestjs/common';
import { TariffPlan } from '../billing/entitlement.types';
import { SavingsEstimate } from './quest.types';
import { SMM_HOURLY_RATE_RUB, WEEKS_PER_MONTH } from './onboarding.config';

/**
 * Калькулятор экономии (шаг 2 «Оценка дружины», spec п.7).
 * Чистая логика на числах из spec: ставка SMM 300–500 ₽/час, 4 недели в месяце.
 */
@Injectable()
export class SavingsCalculator {
  /**
   * @param hoursPerWeek часы/нед, которые сейчас уходят на SMM (и экономятся).
   * @param comparedTariff тариф для сравнения (обычно Богатырский).
   * @param hourlyRateOverride необязательная ставка, если пользователь знает свою.
   */
  estimate(
    hoursPerWeek: number,
    comparedTariff: TariffPlan,
    hourlyRateOverride?: number,
  ): SavingsEstimate {
    const monthlyHoursSaved = hoursPerWeek * WEEKS_PER_MONTH;

    const rateLow = hourlyRateOverride ?? SMM_HOURLY_RATE_RUB.low;
    const rateHigh = hourlyRateOverride ?? SMM_HOURLY_RATE_RUB.high;

    const low = monthlyHoursSaved * rateLow;
    const high = monthlyHoursSaved * rateHigh;

    const price = comparedTariff.priceRub;
    const timesCheaper =
      price > 0
        ? { low: Math.round(low / price), high: Math.round(high / price) }
        : { low: 0, high: 0 };

    return {
      hoursPerWeek,
      monthlyHoursSaved,
      moneyEquivalentRub: { low, high },
      comparedTariff: {
        id: comparedTariff.id,
        title: comparedTariff.title,
        priceRub: price,
      },
      timesCheaper,
    };
  }
}
