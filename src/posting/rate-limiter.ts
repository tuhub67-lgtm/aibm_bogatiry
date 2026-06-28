import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, Clock } from './clock';
import { PublishChannel } from './channel.types';
import { PLATFORM_LIMITS } from './platform-limits.config';

interface DayWindow {
  dayKey: string;
  count: number;
}

/**
 * Rate-limiter суточных лимитов платформ (spec п.3, п.8: публикации только через
 * лимитер, без синхронных «запостить прямо сейчас»).
 *
 * Окно — календарные сутки по UTC. -1 в конфиге = без лимита.
 *
 * [TODO] Для прода счётчики нужно хранить вне процесса (Redis) — иначе при
 * нескольких инстансах лимит платформы можно пробить.
 */
@Injectable()
export class RateLimiter {
  private readonly windows = new Map<PublishChannel, DayWindow>();

  constructor(@Inject(CLOCK) private readonly clock: Clock) {}

  /** Можно ли опубликовать ещё один пост в канал в текущие сутки. */
  canPublish(channel: PublishChannel, now: Date = this.clock()): boolean {
    const limit = PLATFORM_LIMITS[channel].postsPerDay;
    if (limit < 0) {
      return true;
    }
    return this.windowFor(channel, now).count < limit;
  }

  /** Зафиксировать факт публикации (вызывать только после успешной отправки). */
  record(channel: PublishChannel, now: Date = this.clock()): void {
    this.windowFor(channel, now).count += 1;
  }

  private dayKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private windowFor(channel: PublishChannel, now: Date): DayWindow {
    const key = this.dayKey(now);
    const current = this.windows.get(channel);
    if (!current || current.dayKey !== key) {
      const fresh: DayWindow = { dayKey: key, count: 0 };
      this.windows.set(channel, fresh);
      return fresh;
    }
    return current;
  }
}
