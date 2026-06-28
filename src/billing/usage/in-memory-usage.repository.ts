import { Injectable } from '@nestjs/common';
import { LimitKey } from '../entitlement.types';
import { UsagePort } from './usage.port';

/**
 * In-memory реализация учёта использования. Только для разработки/тестов:
 * счётчики живут в памяти процесса и не переживают рестарт.
 *
 * [TODO] Заменить на хранилище в РФ-юрисдикции (Yandex Cloud Postgres / Redis)
 * с атомарным INCR и сбросом по расчётному периоду (spec п.8: хранение ПД в РФ).
 */
@Injectable()
export class InMemoryUsageRepository implements UsagePort {
  private readonly counters = new Map<string, number>();

  private compositeKey(subscriptionId: string, key: LimitKey): string {
    return `${subscriptionId}:${key}`;
  }

  async getUsage(subscriptionId: string, key: LimitKey): Promise<number> {
    return this.counters.get(this.compositeKey(subscriptionId, key)) ?? 0;
  }

  async increment(
    subscriptionId: string,
    key: LimitKey,
    amount: number,
  ): Promise<number> {
    const composite = this.compositeKey(subscriptionId, key);
    const next = (this.counters.get(composite) ?? 0) + amount;
    this.counters.set(composite, next);
    return next;
  }

  async reset(subscriptionId: string, key?: LimitKey): Promise<void> {
    if (key) {
      this.counters.delete(this.compositeKey(subscriptionId, key));
      return;
    }
    for (const composite of [...this.counters.keys()]) {
      if (composite.startsWith(`${subscriptionId}:`)) {
        this.counters.delete(composite);
      }
    }
  }
}
