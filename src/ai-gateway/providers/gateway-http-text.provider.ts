import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TextProvider, TextProviderRequest } from './text-provider.port';

/** Ожидаемая форма ответа шлюза (узкая, под нашу потребность). */
interface GatewayTextResponse {
  variants?: unknown;
}

function extractVariants(payload: unknown): string[] {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    Array.isArray((payload as GatewayTextResponse).variants)
  ) {
    return ((payload as GatewayTextResponse).variants as unknown[]).filter(
      (v): v is string => typeof v === 'string',
    );
  }
  return [];
}

/**
 * Транспорт через AI-шлюз (KodikRouter / ITGLOBAL AIaaS) — legal-compliant
 * маршрутизация к RU-моделям без передачи данных за рубеж (spec п.4, п.8).
 *
 * Активен, когда задан AI_GATEWAY_URL. Схема запроса/ответа — предполагаемая;
 * [TODO] согласовать с реальным контрактом выбранного шлюза.
 */
@Injectable()
export class GatewayHttpTextProvider implements TextProvider {
  readonly name = 'ai-gateway';
  private readonly logger = new Logger(GatewayHttpTextProvider.name);

  constructor(private readonly config: ConfigService) {}

  async generate(request: TextProviderRequest): Promise<string[]> {
    const url = this.config.get<string>('ai.gatewayUrl');
    const apiKey = this.config.get<string>('ai.gatewayApiKey');
    if (!url) {
      throw new ServiceUnavailableException('AI-шлюз не сконфигурирован.');
    }

    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };
    if (apiKey) {
      headers.authorization = `Bearer ${apiKey}`;
    }

    try {
      const response = await fetch(`${url.replace(/\/$/, '')}/v1/text/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: request.model,
          prompt: request.prompt,
          n: request.variants,
        }),
        // Защита от зависаний апстрима.
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        this.logger.error(
          `Шлюз вернул ${response.status} для модели ${request.model}`,
        );
        throw new ServiceUnavailableException('AI-шлюз вернул ошибку.');
      }

      const variants = extractVariants(await response.json());
      return variants.slice(0, request.variants);
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.error(`Сбой обращения к AI-шлюзу: ${String(error)}`);
      throw new ServiceUnavailableException('AI-шлюз недоступен.');
    }
  }
}
