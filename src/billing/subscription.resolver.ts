import { Injectable } from '@nestjs/common';
import { Tariff, isTariff } from './tariff';
import { RequestWithSubscription, Subscription } from './subscription';

/**
 * Порт резолва подписки из запроса. Гард зависит от интерфейса, а не от
 * способа аутентификации — реальный резолвер (по JWT/сессии → БД) подменяется
 * без изменения гарда.
 */
export interface SubscriptionResolverPort {
  resolve(request: RequestWithSubscription): Promise<Subscription>;
}

/** DI-токен резолвера подписки. */
export const SUBSCRIPTION_RESOLVER = Symbol('SUBSCRIPTION_RESOLVER');

/**
 * DEV-резолвер: берёт тариф из заголовка `x-tariff` (по умолчанию Free) и
 * идентификатор подписки из `x-subscription-id`. Нужен, чтобы feature-flag слой
 * был проверяем end-to-end до появления аутентификации.
 *
 * [TODO] Заменить на резолвер по аутентифицированному пользователю:
 * JWT/сессия → user → активная подписка из РФ-БД. В проде заголовкам доверять
 * нельзя — этот резолвер ТОЛЬКО для разработки.
 */
@Injectable()
export class DevHeaderSubscriptionResolver implements SubscriptionResolverPort {
  async resolve(request: RequestWithSubscription): Promise<Subscription> {
    const headerTariff = this.firstHeader(request.headers['x-tariff']);
    const tariff: Tariff = isTariff(headerTariff) ? headerTariff : Tariff.Free;

    const headerId = this.firstHeader(request.headers['x-subscription-id']);
    // Без явного id привязываем счётчики использования к тарифу — стабильно
    // в пределах процесса для ручных проверок.
    const id = headerId ?? `dev-${tariff}`;

    return { id, tariff, status: 'active' };
  }

  private firstHeader(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }
}
