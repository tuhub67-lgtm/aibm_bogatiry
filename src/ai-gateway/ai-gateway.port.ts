/**
 * ПОРТ AI-ШЛЮЗА (seam, без реализации в этом срезе).
 *
 * Все вызовы LLM/генерации изображений обязаны идти через эту абстракцию
 * (spec п.8), чтобы:
 *   - провайдера (YandexGPT/GigaChat/Kandinsky) можно было менять без правок
 *     бизнес-логики модулей;
 *   - встроить compliance-прослойку 152-ФЗ (маршрутизация через
 *     KodikRouter / ITGLOBAL AIaaS), а не звать провайдеров напрямую.
 *
 * Реализация провайдеров — отдельный срез. Здесь только контракт, чтобы
 * модуль контента уже сейчас зависел от интерфейса, а не от конкретного SDK.
 */

/** Класс задачи определяет маршрутизацию на модель (spec п.4). */
export enum AiTextTask {
  /** Базовый/массовый текст → YandexGPT 5 Lite. */
  Basic = 'basic',
  /** Сложный текст/аналитика → GigaChat Ultra / YandexGPT 5 Pro. */
  Complex = 'complex',
}

export interface TextGenerationRequest {
  task: AiTextTask;
  prompt: string;
  /** Сколько вариантов-черновиков вернуть (контент не «финал», а варианты). */
  variants?: number;
}

export interface TextGenerationResult {
  variants: string[];
  /** Какой провайдер фактически обслужил запрос (для аудита/биллинга AI). */
  provider: string;
  /** Какая модель выбрана маршрутизацией (для аудита/биллинга AI). */
  model: string;
}

export interface ImageGenerationRequest {
  /** Промпт на русском — Kandinsky понимает без перевода (spec п.4). */
  prompt: string;
}

export interface ImageGenerationResult {
  /** Ссылки/идентификаторы сгенерированных изображений. */
  images: string[];
  provider: string;
}

/**
 * Контракт AI-шлюза. Реализуется адаптером поверх RU-провайдеров через
 * compliance-прослойку.
 */
export interface AiGatewayPort {
  generateText(request: TextGenerationRequest): Promise<TextGenerationResult>;
  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
}

/** DI-токен AI-шлюза (реализация подключается в отдельном срезе). */
export const AI_GATEWAY = Symbol('AI_GATEWAY');
