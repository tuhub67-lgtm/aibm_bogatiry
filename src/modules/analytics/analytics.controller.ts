import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { EntitlementGuard } from '../../billing/entitlement.guard';
import { RequireFeature } from '../../billing/require-feature.decorator';
import { Feature } from '../../billing/entitlement.types';
import { AnalyticsService } from './analytics.service';
import { DiagnoseDto } from './dto/diagnose.dto';
import {
  BottleneckDiagnosis,
  MarketingMetrics,
} from './analytics.types';

interface DiagnoseResponse {
  diagnosis: BottleneckDiagnosis;
  metrics: MarketingMetrics | null;
}

/**
 * Модуль 4 — Аналитика. Закрыт фичей Analytics (только Богатырский).
 * Расчёт метрик и диагностика воронки — реальная логика (AnalyticsService);
 * источник самих данных (интеграции) подключается отдельно.
 */
@UseGuards(EntitlementGuard)
@RequireFeature(Feature.Analytics)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  /** Диагностика «бутылочного горлышка» + метрики (ROMI/CPO/CR), spec п.5. */
  @Post('diagnose')
  diagnose(@Body() dto: DiagnoseDto): DiagnoseResponse {
    return {
      diagnosis: this.analytics.diagnoseBottleneck(dto.funnel),
      metrics: dto.marketing
        ? this.analytics.computeMetrics(dto.marketing, dto.funnel)
        : null,
    };
  }
}
