import { AiTextTask } from './ai-gateway.port';

/**
 * Маршрутизация задач на конкретные модели/провайдеры (spec п.4).
 * Это конфиг: сменить модель — править здесь, бизнес-логика не меняется.
 */
export interface ModelRoute {
  /** Идентификатор модели у провайдера/шлюза. */
  model: string;
  /** Человекочитаемый провайдер (для аудита/биллинга AI). */
  provider: string;
}

/** Текстовые задачи → модели (spec п.4). */
export const TEXT_ROUTING: Readonly<Record<AiTextTask, ModelRoute>> = {
  // Базовый/массовый текст — самая дешёвая RU-модель.
  [AiTextTask.Basic]: { model: 'yandexgpt-5-lite', provider: 'yandex' },
  // Сложный текст/аналитика. spec допускает GigaChat Ultra ИЛИ YandexGPT 5 Pro —
  // по умолчанию GigaChat Ultra. [TODO: уточнить у заказчика] предпочтение.
  [AiTextTask.Complex]: { model: 'gigachat-ultra', provider: 'sber' },
};

/** Генерация изображений → Kandinsky (spec п.4: бесплатно, понимает русский). */
export const IMAGE_ROUTING: ModelRoute = {
  model: 'kandinsky',
  provider: 'sber',
};
