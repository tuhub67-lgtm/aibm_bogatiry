import { Controller, Get, UseGuards } from '@nestjs/common';
import { EntitlementService } from './entitlement.service';
import { EntitlementGuard } from './entitlement.guard';
import { CurrentSubscription } from './current-subscription.decorator';
import { Subscription } from './subscription';
import { LimitKey } from './entitlement.types';
import { TariffPlanDto, toTariffPlanDto } from './tariff.dto';
import { Remaining } from './entitlement.service';

interface EntitlementsResponse {
  tariff: string;
  subscriptionId: string;
  features: string[];
  limits: Array<{ key: LimitKey; allowed: number | null; remaining: Remaining }>;
}

@Controller('billing')
export class BillingController {
  constructor(private readonly entitlements: EntitlementService) {}

  /**
   * Публичная витрина тарифов — для шага «Выбор пути» в квесте и блока цен
   * на лендинге. Без авторизации.
   */
  @Get('tariffs')
  getTariffs(): TariffPlanDto[] {
    return this.entitlements.listPlans().map(toTariffPlanDto);
  }

  /**
   * Права текущей подписки: возможности и остатки лимитов.
   * Гард резолвит подписку (в dev — из заголовка x-tariff).
   */
  @UseGuards(EntitlementGuard)
  @Get('me/entitlements')
  async getMyEntitlements(
    @CurrentSubscription() subscription: Subscription,
  ): Promise<EntitlementsResponse> {
    const plan = this.entitlements.getPlan(subscription.tariff);

    const limits = await Promise.all(
      (Object.keys(plan.limits) as LimitKey[]).map(async (key) => {
        const allowed = plan.limits[key];
        return {
          key,
          allowed: allowed === -1 ? null : allowed,
          remaining: await this.entitlements.getRemaining(subscription, key),
        };
      }),
    );

    return {
      tariff: subscription.tariff,
      subscriptionId: subscription.id,
      features: [...plan.features],
      limits,
    };
  }
}
