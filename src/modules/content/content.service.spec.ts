import { ContentService } from './content.service';
import { AiGatewayPort } from '../../ai-gateway/ai-gateway.port';

describe('ContentService', () => {
  function makeAi(): AiGatewayPort & { generateText: jest.Mock } {
    return {
      generateText: jest.fn().mockResolvedValue({
        variants: ['v1', 'v2'],
        provider: 'fake',
        model: 'yandexgpt-5-lite',
      }),
      generateImage: jest.fn(),
    };
  }

  it('строит промпт из ниши/темы/структуры и возвращает каркас пресета', async () => {
    const ai = makeAi();
    const service = new ContentService(ai);

    const out = await service.generateDrafts({
      niche: 'кафе',
      topic: 'новое сезонное меню',
      format: 'carousel',
    });

    const prompt = ai.generateText.mock.calls[0][0].prompt as string;
    expect(prompt).toContain('кафе');
    expect(prompt).toContain('новое сезонное меню');
    expect(out.variants).toEqual(['v1', 'v2']);
    expect(out.outline.length).toBeGreaterThan(0);
    expect(out.model).toBe('yandexgpt-5-lite');
  });

  it('добавляет локальный триггер, если указана локальность (spec п.6)', async () => {
    const ai = makeAi();
    const service = new ContentService(ai);

    await service.generateDrafts({
      niche: 'барбершоп',
      topic: 'акция выходного дня',
      format: 'story',
      locality: 'Центральный район',
    });

    const prompt = ai.generateText.mock.calls[0][0].prompt as string;
    expect(prompt).toContain('Центральный район');
  });
});
