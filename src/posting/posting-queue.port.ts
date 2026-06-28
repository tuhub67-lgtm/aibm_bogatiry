import { ChannelResult, PostContent, PublishChannel } from './channel.types';

export interface SchedulePostInput {
  subscriptionId: string;
  channels: PublishChannel[];
  content: PostContent;
  /** Когда публиковать. По умолчанию — немедленно. */
  scheduledAt?: Date;
  /** Приоритетная обработка (тариф Богатырский). */
  priority: boolean;
}

/**
 *  - queued    — ещё не обрабатывалось (отложенная публикация);
 *  - completed — все каналы дошли до терминального исхода (published/skipped);
 *  - partial   — часть каналов отложена (deferred) или упала (failed);
 *  - failed    — ни один канал не доставлен.
 */
export type JobStatus = 'queued' | 'completed' | 'partial' | 'failed';

export interface PublishJob {
  id: string;
  subscriptionId: string;
  channels: PublishChannel[];
  content: PostContent;
  scheduledAt: Date;
  priority: boolean;
  status: JobStatus;
  results: ChannelResult[];
  createdAt: Date;
}

/**
 * Очередь автопостинга. Обязательна по spec п.8: публикации идут через очередь
 * с rate-limiter, без синхронных вызовов «запостить сейчас».
 */
export interface PostingQueuePort {
  enqueue(input: SchedulePostInput): Promise<PublishJob>;
  get(jobId: string): Promise<PublishJob | undefined>;
  /** Обработать «дозревшие» задания (в проде вызывается фоновым воркером). */
  processDue(now?: Date): Promise<void>;
}

export const POSTING_QUEUE = Symbol('POSTING_QUEUE');
