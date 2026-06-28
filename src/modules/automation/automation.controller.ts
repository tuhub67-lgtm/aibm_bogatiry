import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { EntitlementGuard } from '../../billing/entitlement.guard';
import { RequireFeature } from '../../billing/require-feature.decorator';
import { CurrentSubscription } from '../../billing/current-subscription.decorator';
import { Feature, LimitKey } from '../../billing/entitlement.types';
import { Subscription } from '../../billing/subscription';
import { EntitlementService } from '../../billing/entitlement.service';
import { SchedulePostDto } from './dto/schedule-post.dto';

interface ScheduleResponse {
  status: 'queued';
  channels: string[];
  note: string;
}

/**
 * Модуль 3 — AI-автоматизация маркетинга и воронок.
 * Закрыт фичей Autoposting. Демонстрирует связку прав:
 *   - публикация в несколько каналов требует фичу Multichannel;
 *   - каждая постановка в очередь списывает лимит ScheduledPostsPerMonth.
 */
@UseGuards(EntitlementGuard)
@RequireFeature(Feature.Autoposting)
@Controller('automation')
export class AutomationController {
  constructor(private readonly entitlements: EntitlementService) {}

  @Post('posts')
  async schedulePost(
    @CurrentSubscription() subscription: Subscription,
    @Body() dto: SchedulePostDto,
  ): Promise<ScheduleResponse> {
    // Многоканальная публикация — отдельная возможность (Богатырский).
    if (dto.channels.length > 1) {
      this.entitlements.assertFeature(subscription, Feature.Multichannel);
    }

    // Списываем лимит постов: бросит LimitExceededError (403), если исчерпан.
    await this.entitlements.consume(
      subscription,
      LimitKey.ScheduledPostsPerMonth,
      1,
    );

    // [TODO] Реальная постановка в очередь с rate-limiter под суточные лимиты
    // платформ (PLATFORM_LIMITS) и адаптацией контента под формат каждого
    // канала (spec п.3). Очередь — отдельный срез.
    return {
      status: 'queued',
      channels: dto.channels,
      note: '[TODO] Публикация уходит в rate-limit-aware очередь (отдельный срез).',
    };
  }
}
