import { Global, Module } from '@nestjs/common';
import { EntitlementService } from './entitlement.service';
import { EntitlementGuard } from './entitlement.guard';
import { BillingController } from './billing.controller';
import { USAGE_PORT } from './usage/usage.port';
import { InMemoryUsageRepository } from './usage/in-memory-usage.repository';
import {
  SUBSCRIPTION_RESOLVER,
  DevHeaderSubscriptionResolver,
} from './subscription.resolver';

/**
 * Модуль биллинга/прав — ядро тарифного контура. Глобальный, потому что
 * EntitlementService и EntitlementGuard нужны всем 4 продуктовым модулям.
 *
 * Порты (учёт использования, резолв подписки) связаны со своими реализациями
 * здесь — это единственное место, где меняют реализацию на продовую.
 */
@Global()
@Module({
  controllers: [BillingController],
  providers: [
    EntitlementService,
    EntitlementGuard,
    // [TODO] заменить in-memory на хранилище в РФ-юрисдикции.
    { provide: USAGE_PORT, useClass: InMemoryUsageRepository },
    // [TODO] заменить dev-резолвер на резолв по аутентификации.
    { provide: SUBSCRIPTION_RESOLVER, useClass: DevHeaderSubscriptionResolver },
  ],
  // Экспортируем и токены-зависимости гарда: когда EntitlementGuard
  // подключается через @UseGuards в других модулях, Nest резолвит его
  // конструктор в их контексте — значит SUBSCRIPTION_RESOLVER/USAGE_PORT
  // тоже должны быть видимы (модуль @Global, поэтому видимы везде).
  exports: [
    EntitlementService,
    EntitlementGuard,
    SUBSCRIPTION_RESOLVER,
    USAGE_PORT,
  ],
})
export class BillingModule {}
