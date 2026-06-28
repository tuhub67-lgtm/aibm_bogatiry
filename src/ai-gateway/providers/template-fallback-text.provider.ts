import { Injectable } from '@nestjs/common';
import { TextProvider, TextProviderRequest } from './text-provider.port';

/**
 * Локальный фолбэк, когда AI-шлюз не настроен (нет AI_GATEWAY_URL).
 *
 * Это НЕ AI-генерация: провайдер детерминированно возвращает заготовки на
 * основе уже собранного промпта (модуль контента кладёт туда нишу/тему/формат/
 * локальность и каркас поста). Так модуль контента работоспособен в dev без
 * секретов, а пользователь честно видит, что это структурная заготовка под
 * доработку, а не готовый текст.
 */
@Injectable()
export class TemplateFallbackTextProvider implements TextProvider {
  readonly name = 'local-template-fallback';

  async generate(request: TextProviderRequest): Promise<string[]> {
    const base = request.prompt.trim();
    const angles = [
      'Вариант с акцентом на пользу для клиента',
      'Вариант с акцентом на локальность и срочность',
    ];

    return Array.from({ length: Math.max(1, request.variants) }, (_, index) => {
      const angle = angles[index % angles.length];
      return [
        `[Заготовка ${index + 1} · AI-шлюз не настроен — ${angle}]`,
        base,
      ].join('\n');
    });
  }
}
