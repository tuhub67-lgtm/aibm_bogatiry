import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, Clock } from './clock';
import { ChannelResult, PublishChannel } from './channel.types';
import { ContentAdapter } from './content-adapter';
import { RateLimiter } from './rate-limiter';
import { PublisherRegistry } from './publishers/publisher-registry';
import {
  JobStatus,
  PostingQueuePort,
  PublishJob,
  SchedulePostInput,
} from './posting-queue.port';

/**
 * In-memory очередь автопостинга. Для dev/тестов: задания живут в памяти.
 *
 * Каждый канал проходит rate-limiter → адаптацию → публикатор. Каналы, упёршиеся
 * в суточный лимит, помечаются 'deferred' и не теряются — повторная обработка
 * через processDue() (в проде её дёргает фоновый воркер).
 *
 * [TODO] Заменить на брокер (BullMQ/Redis) с воркером и персистентностью;
 * сейчас «дозревшие» задания обрабатываются сразу в enqueue (см. processDue),
 * а отложенные по времени задания ждут вызова processDue воркером.
 */
@Injectable()
export class InMemoryPostingQueue implements PostingQueuePort {
  private readonly jobs = new Map<string, PublishJob>();

  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly adapter: ContentAdapter,
    private readonly rateLimiter: RateLimiter,
    private readonly registry: PublisherRegistry,
  ) {}

  async enqueue(input: SchedulePostInput): Promise<PublishJob> {
    const now = this.clock();
    const job: PublishJob = {
      id: randomUUID(),
      subscriptionId: input.subscriptionId,
      channels: input.channels,
      content: input.content,
      scheduledAt: input.scheduledAt ?? now,
      priority: input.priority,
      status: 'queued',
      results: [],
      createdAt: now,
    };
    this.jobs.set(job.id, job);

    // Обрабатываем то, что уже «дозрело» (немедленные публикации).
    await this.processDue(now);

    return this.jobs.get(job.id) ?? job;
  }

  async get(jobId: string): Promise<PublishJob | undefined> {
    return this.jobs.get(jobId);
  }

  async processDue(now: Date = this.clock()): Promise<void> {
    const due = [...this.jobs.values()]
      .filter(
        (job) =>
          (job.status === 'queued' || job.status === 'partial') &&
          job.scheduledAt.getTime() <= now.getTime(),
      )
      // Приоритетные (Богатырский) — первыми, далее по времени постановки.
      .sort(
        (a, b) =>
          Number(b.priority) - Number(a.priority) ||
          a.scheduledAt.getTime() - b.scheduledAt.getTime(),
      );

    for (const job of due) {
      await this.processJob(job, now);
    }
  }

  private async processJob(job: PublishJob, now: Date): Promise<void> {
    const results = [...job.results];
    // Каналы, уже дошедшие до терминального исхода, не трогаем (повтор — только
    // для 'deferred').
    const settled = new Set(
      results.filter((r) => r.outcome !== 'deferred').map((r) => r.channel),
    );

    for (const channel of job.channels) {
      if (settled.has(channel)) {
        continue;
      }

      if (!this.rateLimiter.canPublish(channel, now)) {
        this.upsert(results, {
          channel,
          outcome: 'deferred',
          detail: 'суточный лимит платформы исчерпан',
        });
        continue;
      }

      const publisher = this.registry.get(channel);
      if (!publisher) {
        this.upsert(results, {
          channel,
          outcome: 'failed',
          detail: 'нет публикатора для канала',
        });
        continue;
      }

      const adapted = this.adapter.adapt(channel, job.content);
      const result = await publisher.publish(adapted);
      if (result.outcome === 'published') {
        this.rateLimiter.record(channel, now);
      }
      this.upsert(results, result);
    }

    job.results = results;
    job.status = this.deriveStatus(job.channels, results);
    this.jobs.set(job.id, job);
  }

  private upsert(results: ChannelResult[], result: ChannelResult): void {
    const index = results.findIndex((r) => r.channel === result.channel);
    if (index >= 0) {
      results[index] = result;
    } else {
      results.push(result);
    }
  }

  private deriveStatus(
    channels: PublishChannel[],
    results: ChannelResult[],
  ): JobStatus {
    const outcomeOf = new Map(results.map((r) => [r.channel, r.outcome]));
    const outcomes = channels.map((c) => outcomeOf.get(c));

    if (outcomes.every((o) => o === 'published' || o === 'skipped')) {
      return 'completed';
    }
    if (outcomes.some((o) => o === 'deferred')) {
      return 'partial';
    }
    if (outcomes.some((o) => o === 'published' || o === 'skipped')) {
      return 'partial';
    }
    return 'failed';
  }
}
