import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { AiGatewayModule } from '../../ai-gateway/ai-gateway.module';

/** Модуль 2 — Генератор контент-стратегий и медиа (изолированный домен). */
@Module({
  imports: [AiGatewayModule],
  controllers: [ContentController],
  providers: [ContentService],
  // Экспортируем для переиспользования демо-генерации в онбординг-квесте.
  exports: [ContentService],
})
export class ContentModule {}
