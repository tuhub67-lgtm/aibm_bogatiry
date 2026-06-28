import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { HealthController } from './common/health.controller';
import { BillingModule } from './billing/billing.module';
import { SiteBuilderModule } from './modules/site-builder/site-builder.module';
import { ContentModule } from './modules/content/content.module';
import { AutomationModule } from './modules/automation/automation.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { OnboardingModule } from './onboarding/onboarding.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validate: validateEnv,
    }),
    // Ядро тарифов/прав (глобальный модуль) — используется всеми доменами.
    BillingModule,
    // 4 продуктовых модуля как изолированные домены (spec п.8).
    SiteBuilderModule,
    ContentModule,
    AutomationModule,
    AnalyticsModule,
    // Предпродажный онбординг-квест (spec п.7).
    OnboardingModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
