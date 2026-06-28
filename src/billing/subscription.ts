import { Tariff } from './tariff';

/**
 * Подписка пользователя — то, на основании чего проверяются права.
 * В реальной системе резолвится из БД по аутентифицированному пользователю.
 *
 * Поля периода/статуса нужны слою учёта использования: счётчики лимитов
 * привязаны к расчётному периоду подписки.
 */
export interface Subscription {
  /** Идентификатор подписки (ключ для счётчиков использования). */
  id: string;
  tariff: Tariff;
  /** [TODO: уточнить у заказчика] модель статусов (active/past_due/canceled и т.п.). */
  status?: 'active' | 'trialing' | 'past_due' | 'canceled';
  /** Начало текущего расчётного периода (для сброса лимитов). */
  currentPeriodStart?: Date;
}

/**
 * Расширение типа запроса: гард кладёт сюда резолвнутую подписку,
 * а параметр-декоратор @CurrentSubscription её читает.
 */
export interface RequestWithSubscription {
  subscription?: Subscription;
  headers: Record<string, string | string[] | undefined>;
}
