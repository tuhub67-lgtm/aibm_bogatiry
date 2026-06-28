import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { EntitlementGuard } from '../../billing/entitlement.guard';
import { RequireFeature } from '../../billing/require-feature.decorator';
import { CurrentSubscription } from '../../billing/current-subscription.decorator';
import { Feature, LimitKey } from '../../billing/entitlement.types';
import { Subscription } from '../../billing/subscription';
import { EntitlementService } from '../../billing/entitlement.service';
import { GenerateDraftDto } from './dto/generate-draft.dto';
import { ContentService } from './content.service';

interface DraftResponse {
  /** Варианты-черновики (а не один «стерильный» финал), spec п.4. */
  variants: string[];
  /** Каркас поста из пресета формата. */
  outline: string[];
  guidance: string;
  format: string;
  provider: string;
  model: string;
  /** Обязательный UX-шаг: правка перед публикацией (spec п.4, принцип доверия). */
  requiresEditBeforePublish: true;
  note: string;
}

/**
 * Модуль 2 — Генератор контент-стратегий и медиа.
 * Закрыт фичей ContentGeneration. Списывает лимит ContentGenerationsPerMonth
 * по факту успешной генерации (не штрафуем за упавший вызов AI-шлюза).
 */
@UseGuards(EntitlementGuard)
@RequireFeature(Feature.ContentGeneration)
@Controller('content')
export class ContentController {
  constructor(
    private readonly entitlements: EntitlementService,
    private readonly content: ContentService,
  ) {}

  @Post('drafts')
  async generateDraft(
    @CurrentSubscription() subscription: Subscription,
    @Body() dto: GenerateDraftDto,
  ): Promise<DraftResponse> {
    // 1) Предварительная проверка лимита (без списания) — бросит 403, если исчерпан.
    await this.entitlements.assertWithinLimit(
      subscription,
      LimitKey.ContentGenerationsPerMonth,
      1,
    );

    // 2) Генерация через AI-шлюз (или локальный фолбэк, если шлюз не настроен).
    const draft = await this.content.generateDrafts(dto);

    // 3) Списываем лимит по факту успеха.
    await this.entitlements.recordUsage(
      subscription,
      LimitKey.ContentGenerationsPerMonth,
      1,
    );

    return {
      variants: draft.variants,
      outline: draft.outline,
      guidance: draft.guidance,
      format: dto.format,
      provider: draft.provider,
      model: draft.model,
      requiresEditBeforePublish: true,
      note: 'Добавьте реальный контекст (фото до/после, отзывы) перед публикацией.',
    };
  }
}
