import { LimitKey } from '../entitlement.types';

/**
 * Порт учёта использования лимитов. Бизнес-логика зависит от этого интерфейса,
 * а не от конкретного хранилища — реализацию (in-memory для dev, РФ-Postgres
 * для prod) можно подменить без переписывания EntitlementService.
 */
export interface UsagePort {
  /** Текущее использование лимита подпиской в рамках расчётного периода. */
  getUsage(subscriptionId: string, key: LimitKey): Promise<number>;

  /**
   * Атомарно увеличить счётчик. Возвращает новое значение.
   * Атомарность важна, чтобы параллельные генерации не пробивали лимит.
   */
  increment(
    subscriptionId: string,
    key: LimitKey,
    amount: number,
  ): Promise<number>;

  /**
   * Сбросить счётчики (вызывается планировщиком в начале расчётного периода).
   * Без key — сбрасывает все лимиты подписки.
   */
  reset(subscriptionId: string, key?: LimitKey): Promise<void>;
}

/** DI-токен порта учёта использования. */
export const USAGE_PORT = Symbol('USAGE_PORT');
