import { Controller, Get, UseGuards } from '@nestjs/common';
import { EntitlementGuard } from '../../billing/entitlement.guard';
import { RequireFeature } from '../../billing/require-feature.decorator';
import { Feature } from '../../billing/entitlement.types';

/**
 * Модуль 1 — Конструктор сайтов/лендингов.
 * Закрыт фичей SiteBuilder. Сейчас — заглушка-каркас: эндпоинты есть и
 * защищены тарифом, бизнес-логика генерации лендингов — отдельный срез.
 */
@UseGuards(EntitlementGuard)
@RequireFeature(Feature.SiteBuilder)
@Controller('site-builder')
export class SiteBuilderController {
  /**
   * Пресеты шаблонов лендингов. Структура продающего лендинга из spec п.7:
   * вводные → план/что входит → расчёт стоимости → как работает → кейсы → CTA.
   */
  @Get('templates')
  listTemplates(): { templates: Array<{ id: string; title: string }>; note: string } {
    return {
      // [TODO] Реальная библиотека пресетов под ниши (салон/кафе/магазин).
      templates: [
        { id: 'sale-landing', title: 'Продающий лендинг (от главного к второстепенному)' },
      ],
      note: '[TODO] Генерация страниц подключается через AI-gateway (отдельный срез).',
    };
  }
}
