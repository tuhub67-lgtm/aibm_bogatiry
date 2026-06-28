import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';

/** Модуль 3 — AI-автоматизация маркетинга и воронок (изолированный домен). */
@Module({
  controllers: [AutomationController],
})
export class AutomationModule {}
