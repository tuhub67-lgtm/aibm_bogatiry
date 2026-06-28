import { Module } from '@nestjs/common';
import { SiteBuilderController } from './site-builder.controller';

/** Модуль 1 — Конструктор сайтов/лендингов (изолированный домен). */
@Module({
  controllers: [SiteBuilderController],
})
export class SiteBuilderModule {}
