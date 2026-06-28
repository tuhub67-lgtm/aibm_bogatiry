import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { SavingsCalculator } from './savings.calculator';
import {
  QUEST_SESSION_STORE,
  InMemoryQuestSessionStore,
} from './quest-session.store';
import { ContentModule } from '../modules/content/content.module';

/**
 * Онбординг-квест (spec п.7). Переиспользует ContentService для демо-генерации
 * («первый трофей») и EntitlementService (глобальный) для витрины тарифов.
 */
@Module({
  imports: [ContentModule],
  controllers: [OnboardingController],
  providers: [
    OnboardingService,
    SavingsCalculator,
    // [TODO] заменить in-memory на хранилище сессий в РФ-юрисдикции.
    { provide: QUEST_SESSION_STORE, useClass: InMemoryQuestSessionStore },
  ],
})
export class OnboardingModule {}
