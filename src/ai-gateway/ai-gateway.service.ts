import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  AiGatewayPort,
  ImageGenerationRequest,
  ImageGenerationResult,
  TextGenerationRequest,
  TextGenerationResult,
} from './ai-gateway.port';
import { IMAGE_ROUTING, TEXT_ROUTING } from './ai-routing.config';
import { TEXT_PROVIDER, TextProvider } from './providers/text-provider.port';

/**
 * Реализация AI-шлюза. Единственная точка, через которую модули генерируют
 * контент: маршрутизирует задачу на модель (TEXT_ROUTING) и делегирует
 * выбранному транспорту (HTTP-шлюз или локальный фолбэк).
 *
 * Принцип spec п.4: возвращаем варианты-черновики, а не один «финал» —
 * число вариантов запрашивает вызывающий модуль.
 */
@Injectable()
export class AiGatewayService implements AiGatewayPort {
  private readonly logger = new Logger(AiGatewayService.name);

  constructor(
    @Inject(TEXT_PROVIDER) private readonly textProvider: TextProvider,
  ) {}

  async generateText(
    request: TextGenerationRequest,
  ): Promise<TextGenerationResult> {
    const route = TEXT_ROUTING[request.task];
    const variants = await this.textProvider.generate({
      model: route.model,
      task: request.task,
      prompt: request.prompt,
      variants: request.variants ?? 1,
    });

    return {
      variants,
      provider: this.textProvider.name,
      model: route.model,
    };
  }

  async generateImage(
    _request: ImageGenerationRequest,
  ): Promise<ImageGenerationResult> {
    // [TODO] Подключить image-провайдер (Kandinsky через шлюз) отдельным срезом,
    // симметрично текстовому. Пока возвращаем пустой результат, не имитируя.
    this.logger.warn(
      'Генерация изображений ещё не подключена (Kandinsky/шлюз).',
    );
    return { images: [], provider: IMAGE_ROUTING.provider };
  }
}
