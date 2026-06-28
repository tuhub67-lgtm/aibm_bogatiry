import { AiGatewayService } from './ai-gateway.service';
import { AiTextTask } from './ai-gateway.port';
import { TextProvider } from './providers/text-provider.port';

describe('AiGatewayService', () => {
  function makeProvider(): TextProvider & { generate: jest.Mock } {
    return { name: 'fake', generate: jest.fn().mockResolvedValue(['a', 'b']) };
  }

  it('маршрутизирует базовый текст на YandexGPT 5 Lite', async () => {
    const provider = makeProvider();
    const service = new AiGatewayService(provider);

    const res = await service.generateText({
      task: AiTextTask.Basic,
      prompt: 'p',
      variants: 2,
    });

    expect(provider.generate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'yandexgpt-5-lite', variants: 2 }),
    );
    expect(res).toEqual({
      variants: ['a', 'b'],
      provider: 'fake',
      model: 'yandexgpt-5-lite',
    });
  });

  it('маршрутизирует сложный текст на GigaChat Ultra (variants по умолчанию 1)', async () => {
    const provider = makeProvider();
    const service = new AiGatewayService(provider);

    const res = await service.generateText({
      task: AiTextTask.Complex,
      prompt: 'p',
    });

    expect(provider.generate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gigachat-ultra', variants: 1 }),
    );
    expect(res.model).toBe('gigachat-ultra');
  });

  it('изображения пока не подключены — пустой результат без имитации', async () => {
    const service = new AiGatewayService(makeProvider());
    const res = await service.generateImage({ prompt: 'кот' });
    expect(res.images).toEqual([]);
  });
});
