import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';

/** Модуль 2 — Генератор контент-стратегий и медиа (изолированный домен). */
@Module({
  controllers: [ContentController],
})
export class ContentModule {}
