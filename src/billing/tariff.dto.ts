import { Tariff } from './tariff';
import {
  Feature,
  LimitKey,
  TariffPlan,
  isUnlimited,
} from './entitlement.types';

/** Лимит в публичном представлении: null = без ограничения. */
export interface LimitDto {
  key: LimitKey;
  value: number | null;
  unlimited: boolean;
}

/** Тариф для витрины (квест/лендинг). UNLIMITED отдаётся как null. */
export interface TariffPlanDto {
  id: Tariff;
  title: string;
  priceRub: number;
  billingPeriod: 'month';
  positioning: string;
  features: Feature[];
  limits: LimitDto[];
  priority: boolean;
}

export function toTariffPlanDto(plan: TariffPlan): TariffPlanDto {
  return {
    id: plan.id,
    title: plan.title,
    priceRub: plan.priceRub,
    billingPeriod: plan.billingPeriod,
    positioning: plan.positioning,
    features: [...plan.features],
    limits: (Object.keys(plan.limits) as LimitKey[]).map((key) => {
      const value = plan.limits[key];
      const unlimited = isUnlimited(value);
      return { key, value: unlimited ? null : value, unlimited };
    }),
    priority: plan.priority,
  };
}
