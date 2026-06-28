import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { EntitlementGuard } from '../../billing/entitlement.guard';
import { RequireFeature } from '../../billing/require-feature.decorator';
import { CurrentSubscription } from '../../billing/current-subscription.decorator';
import { Feature, LimitKey } from '../../billing/entitlement.types';
import { Subscription } from '../../billing/subscription';
import { EntitlementService } from '../../billing/entitlement.service';
import { GenerateDraftDto } from './dto/generate-draft.dto';

interface DraftResponse {
  /** Несколько вариантов-черновиков, а не один «стерильный» финал (spec п.4). */
  variants: string[];
  format: string;
  /** Обязательный UX-шаг: правка перед публикацией (spec п.4, принцип доверия). */
  requiresEditBeforePublish: true;
  note: string;
}

/**
 * Модуль 2 — Генератор контент-стратегий и медиа.
 * Закрыт фичей ContentGeneration. Каждая генерация списывает лимит
 * ContentGenerationsPerMonth через EntitlementService.consume().
 */
@UseGuards(EntitlementGuard)
@RequireFeature(Feature.ContentGeneration)
@Controller('content')
export class ContentController {
  constructor(private readonly entitlements: EntitlementService) {}

  @Post('drafts')
  async generateDraft(
    @CurrentSubscription() subscription: Subscription,
    @Body() dto: GenerateDraftDto,
  ): Promise<DraftResponse> {
    // Списываем лимит ДО генерации: бросит LimitExceededError (403), если
    // исчерпан. Реальная генерация подключается через AI-gateway.
    await this.entitlements.consume(
      subscription,
      LimitKey.ContentGenerationsPerMonth,
      1,
    );

    // [TODO] Реальная генерация черновиков через AI-gateway
    // (YandexGPT 5 Lite для текста). Сейчас — каркас, чтобы виден был
    // контракт ответа и списание лимита.
    return {
      variants: [
        `[TODO: AI-gateway] Черновик 1 — «${dto.topic}» для ниши «${dto.niche}»`,
        `[TODO: AI-gateway] Черновик 2 — альтернативный заголовок`,
      ],
      format: dto.format,
      requiresEditBeforePublish: true,
      note: 'Добавьте реальный контекст (фото до/после, отзывы) перед публикацией.',
    };
  }
}
