import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { RequestWithSubscription, Subscription } from './subscription';

/**
 * Достаёт подписку, которую EntitlementGuard положил в запрос.
 * Требует, чтобы на маршруте был включён EntitlementGuard — иначе подписка
 * не резолвится и это ошибка конфигурации, а не клиента.
 *
 *   @Get() handler(@CurrentSubscription() sub: Subscription) { ... }
 */
export const CurrentSubscription = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Subscription => {
    const request = ctx.switchToHttp().getRequest<RequestWithSubscription>();
    if (!request.subscription) {
      throw new InternalServerErrorException(
        'Подписка не резолвлена: на маршруте отсутствует EntitlementGuard.',
      );
    }
    return request.subscription;
  },
);
