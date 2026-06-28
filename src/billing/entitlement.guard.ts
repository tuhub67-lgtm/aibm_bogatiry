import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Feature } from './entitlement.types';
import { EntitlementService } from './entitlement.service';
import { REQUIRE_FEATURE_KEY } from './require-feature.decorator';
import { RequestWithSubscription } from './subscription';
import {
  SUBSCRIPTION_RESOLVER,
  SubscriptionResolverPort,
} from './subscription.resolver';

/**
 * Гард прав доступа. Делает две вещи на защищённых маршрутах:
 *   1) резолвит подписку и кладёт её в запрос (для @CurrentSubscription);
 *   2) если у маршрута есть @RequireFeature — проверяет наличие ВСЕХ возможностей,
 *      иначе бросает FeatureNotAvailableError с подсказкой, где фича доступна.
 *
 * Маршруты без @RequireFeature всё равно получают резолвнутую подписку —
 * это позволяет читать тариф/остатки лимитов без принудительного гейтинга.
 */
@Injectable()
export class EntitlementGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlements: EntitlementService,
    @Inject(SUBSCRIPTION_RESOLVER)
    private readonly subscriptionResolver: SubscriptionResolverPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithSubscription>();

    const subscription = await this.subscriptionResolver.resolve(request);
    request.subscription = subscription;

    const requiredFeatures =
      this.reflector.getAllAndOverride<Feature[] | undefined>(
        REQUIRE_FEATURE_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    for (const feature of requiredFeatures) {
      // Бросает FeatureNotAvailableError (403) с машиночитаемым кодом.
      this.entitlements.assertFeature(subscription, feature);
    }

    return true;
  }
}
