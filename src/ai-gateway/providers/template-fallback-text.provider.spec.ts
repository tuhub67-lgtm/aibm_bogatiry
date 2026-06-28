import { TemplateFallbackTextProvider } from './template-fallback-text.provider';
import { AiTextTask } from '../ai-gateway.port';

describe('TemplateFallbackTextProvider', () => {
  const provider = new TemplateFallbackTextProvider();

  it('возвращает запрошенное число заготовок с исходным промптом', async () => {
    const out = await provider.generate({
      model: 'm',
      task: AiTextTask.Basic,
      prompt: 'ТЕКСТ ПРОМПТА',
      variants: 2,
    });

    expect(out).toHaveLength(2);
    expect(out[0]).toContain('ТЕКСТ ПРОМПТА');
    // Честная пометка: это не AI-генерация.
    expect(out[0]).toContain('AI-шлюз не настроен');
  });

  it('всегда возвращает минимум одну заготовку', async () => {
    const out = await provider.generate({
      model: 'm',
      task: AiTextTask.Basic,
      prompt: 'x',
      variants: 0,
    });
    expect(out).toHaveLength(1);
  });
});
