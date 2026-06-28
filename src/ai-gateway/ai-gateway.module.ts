import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_GATEWAY } from './ai-gateway.port';
import { AiGatewayService } from './ai-gateway.service';
import { TEXT_PROVIDER } from './providers/text-provider.port';
import { GatewayHttpTextProvider } from './providers/gateway-http-text.provider';
import { TemplateFallbackTextProvider } from './providers/template-fallback-text.provider';

/**
 * Модуль AI-шлюза. Экспортирует порт AI_GATEWAY — модули генерации зависят от
 * абстракции, а не от провайдера.
 *
 * Выбор транспорта — на старте: задан AI_GATEWAY_URL → HTTP-шлюз (152-ФЗ
 * прослойка), иначе локальный фолбэк (dev без секретов).
 */
@Module({
  providers: [
    GatewayHttpTextProvider,
    TemplateFallbackTextProvider,
    {
      provide: TEXT_PROVIDER,
      useFactory: (
        config: ConfigService,
        gateway: GatewayHttpTextProvider,
        fallback: TemplateFallbackTextProvider,
      ) => (config.get<string>('ai.gatewayUrl') ? gateway : fallback),
      inject: [ConfigService, GatewayHttpTextProvider, TemplateFallbackTextProvider],
    },
    { provide: AI_GATEWAY, useClass: AiGatewayService },
  ],
  exports: [AI_GATEWAY],
})
export class AiGatewayModule {}
