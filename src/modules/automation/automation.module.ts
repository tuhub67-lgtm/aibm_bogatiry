import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { PostingModule } from '../../posting/posting.module';

/** Модуль 3 — AI-автоматизация маркетинга и воронок (изолированный домен). */
@Module({
  imports: [PostingModule],
  controllers: [AutomationController],
})
export class AutomationModule {}
