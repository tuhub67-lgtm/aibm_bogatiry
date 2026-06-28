import { AiTextTask } from '../ai-gateway.port';

export interface TextProviderRequest {
  /** Модель, выбранная маршрутизацией (TEXT_ROUTING). */
  model: string;
  task: AiTextTask;
  prompt: string;
  variants: number;
}

/**
 * Транспорт генерации текста. Абстрагирует «как дойти до модели»:
 * HTTP-шлюз с 152-ФЗ-прослойкой либо локальный фолбэк, если шлюз не настроен.
 */
export interface TextProvider {
  /** Имя для аудита: что фактически обслужило запрос. */
  readonly name: string;
  generate(request: TextProviderRequest): Promise<string[]>;
}

/** DI-токен выбранного транспорта генерации текста. */
export const TEXT_PROVIDER = Symbol('TEXT_PROVIDER');
