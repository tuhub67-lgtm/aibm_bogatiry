import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EntitlementGuard } from './entitlement.guard';
import { EntitlementService } from './entitlement.service';
import { InMemoryUsageRepository } from './usage/in-memory-usage.repository';
import { DevHeaderSubscriptionResolver } from './subscription.resolver';
import { Feature } from './entitlement.types';
import { FeatureNotAvailableError } from './entitlement.errors';
import { RequestWithSubscription } from './subscription';

describe('EntitlementGuard', () => {
  const entitlements = new EntitlementService(new InMemoryUsageRepository());
  const resolver = new DevHeaderSubscriptionResolver();

  function makeGuard(requiredFeatures: Feature[] | undefined): EntitlementGuard {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(requiredFeatures),
    } as unknown as Reflector;
    return new EntitlementGuard(reflector, entitlements, resolver);
  }

  function makeContext(
    headers: Record<string, string>,
  ): { ctx: ExecutionContext; request: RequestWithSubscription } {
    const request: RequestWithSubscription = { headers };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;
    return { ctx, request };
  }

  it('пропускает и кладёт подписку в запрос, если фич не требуется', async () => {
    const guard = makeGuard(undefined);
    const { ctx, request } = makeContext({ 'x-tariff': 'lite' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.subscription?.tariff).toBe('lite');
  });

  it('пропускает Богатырский на маршрут с аналитикой', async () => {
    const guard = makeGuard([Feature.Analytics]);
    const { ctx } = makeContext({ 'x-tariff': 'bogatyr' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('блокирует Лайт на маршруте с аналитикой', async () => {
    const guard = makeGuard([Feature.Analytics]);
    const { ctx } = makeContext({ 'x-tariff': 'lite' });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      FeatureNotAvailableError,
    );
  });

  it('по умолчанию (без заголовка) тариф — Бесплатный', async () => {
    const guard = makeGuard(undefined);
    const { ctx, request } = makeContext({});

    await guard.canActivate(ctx);
    expect(request.subscription?.tariff).toBe('free');
  });
});
