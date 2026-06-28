import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { EntitlementGuard } from '../../billing/entitlement.guard';
import { RequireFeature } from '../../billing/require-feature.decorator';
import { CurrentSubscription } from '../../billing/current-subscription.decorator';
import { Feature, LimitKey } from '../../billing/entitlement.types';
import { Subscription } from '../../billing/subscription';
import { EntitlementService } from '../../billing/entitlement.service';
import {
  JobStatus,
  POSTING_QUEUE,
  PostingQueuePort,
} from '../../posting/posting-queue.port';
import { ChannelResult } from '../../posting/channel.types';
import { SchedulePostDto } from './dto/schedule-post.dto';

interface ScheduleResponse {
  jobId: string;
  status: JobStatus;
  results: ChannelResult[];
}

/**
 * Модуль 3 — AI-автоматизация маркетинга и воронок.
 * Закрыт фичей Autoposting. Публикация идёт ТОЛЬКО через очередь с rate-limiter
 * (spec п.8), а не синхронным вызовом. Связка прав:
 *   - публикация в несколько каналов требует фичу Multichannel;
 *   - каждая постановка в очередь списывает лимит ScheduledPostsPerMonth;
 *   - приоритет в очереди берётся из тарифа (Богатырский).
 */
@UseGuards(EntitlementGuard)
@RequireFeature(Feature.Autoposting)
@Controller('automation')
export class AutomationController {
  constructor(
    private readonly entitlements: EntitlementService,
    @Inject(POSTING_QUEUE) private readonly queue: PostingQueuePort,
  ) {}

  @Post('posts')
  async schedulePost(
    @CurrentSubscription() subscription: Subscription,
    @Body() dto: SchedulePostDto,
  ): Promise<ScheduleResponse> {
    // Многоканальная публикация — отдельная возможность (Богатырский).
    if (dto.channels.length > 1) {
      this.entitlements.assertFeature(subscription, Feature.Multichannel);
    }

    // Проверяем лимит постов (без списания) — бросит 403, если исчерпан.
    await this.entitlements.assertWithinLimit(
      subscription,
      LimitKey.ScheduledPostsPerMonth,
      1,
    );

    const plan = this.entitlements.getPlan(subscription.tariff);
    const job = await this.queue.enqueue({
      subscriptionId: subscription.id,
      channels: dto.channels,
      content: { text: dto.text, media: dto.media },
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      priority: plan.priority,
    });

    // Списываем лимит по факту постановки в очередь.
    await this.entitlements.recordUsage(
      subscription,
      LimitKey.ScheduledPostsPerMonth,
      1,
    );

    return { jobId: job.id, status: job.status, results: job.results };
  }
}
