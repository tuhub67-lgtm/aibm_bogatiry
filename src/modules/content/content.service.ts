import { Inject, Injectable } from '@nestjs/common';
import { AI_GATEWAY, AiGatewayPort, AiTextTask } from '../../ai-gateway/ai-gateway.port';
import { GenerateDraftDto } from './dto/generate-draft.dto';
import { CONTENT_PRESETS, ContentPreset } from './content-presets';

export interface DraftResult {
  variants: string[];
  /** Каркас поста из пресета формата — показывается в UI как структура. */
  outline: string[];
  guidance: string;
  /** Провайдер/модель, обслужившие генерацию (для аудита). */
  provider: string;
  model: string;
}

/**
 * Генерация черновиков контента. Модуль владеет промпт-инжинирингом и пресетами
 * форматов; собственно генерацию делегирует AI-шлюзу (порт AI_GATEWAY).
 */
@Injectable()
export class ContentService {
  constructor(
    @Inject(AI_GATEWAY) private readonly aiGateway: AiGatewayPort,
  ) {}

  async generateDrafts(dto: GenerateDraftDto): Promise<DraftResult> {
    const preset = CONTENT_PRESETS[dto.format];
    const prompt = this.buildPrompt(dto, preset);

    const result = await this.aiGateway.generateText({
      // Базовый/массовый текст → YandexGPT 5 Lite (spec п.4).
      task: AiTextTask.Basic,
      prompt,
      // Варианты, а не один «финал» (spec п.4).
      variants: 2,
    });

    return {
      variants: result.variants,
      outline: preset.outline,
      guidance: preset.guidance,
      provider: result.provider,
      model: result.model,
    };
  }

  /**
   * Собирает промпт для AI-шлюза из данных бизнеса и пресета формата.
   * Локальность — главный триггер (spec п.6): если указан город/район,
   * добавляем локальный «крючок».
   */
  private buildPrompt(dto: GenerateDraftDto, preset: ContentPreset): string {
    const lines = [
      `Ниша бизнеса: ${dto.niche}.`,
      `Тема поста: ${dto.topic}.`,
      `Формат: ${preset.title}. ${preset.guidance}`,
      `Структура: ${preset.outline.join(' → ')}.`,
    ];

    if (dto.locality) {
      lines.push(
        `Локальность: апеллируй к «${dto.locality}» — местные триггеры (район, погода, событие), захват внимания поблизости.`,
      );
    }

    lines.push(
      'Дай 2 коротких варианта-черновика на русском под доработку: живой язык, язык выгод клиента, без канцелярита. Это черновик для правки, не финальный текст.',
    );

    return lines.join('\n');
  }
}
