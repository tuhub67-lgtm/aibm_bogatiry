import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { OnboardingService, QuestOffer } from './onboarding.service';
import { SubmitBriefDto } from './dto/submit-brief.dto';
import { EstimateSavingsDto } from './dto/estimate-savings.dto';
import { QuestSession, SavingsEstimate } from './quest.types';
import { TrustPrinciple } from './onboarding.config';

interface QuestProgress {
  sessionId: string;
  completedSteps: string[];
  hasBrief: boolean;
  savings: SavingsEstimate | null;
  demoDone: boolean;
}

/**
 * Предпродажный «богатырский квест» (spec п.7). Публичные эндпоинты — без
 * авторизации и тарифа: задача воронки — довести гостя до триала.
 */
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  /** Блок доверия (152-ФЗ, контроль, прозрачность) — обязателен в UX. */
  @Get('trust')
  trust(): { principles: ReadonlyArray<TrustPrinciple> } {
    return { principles: this.onboarding.trust() };
  }

  /** Витрина тарифов vs человек — публично (для лендинга и шага «Выбор пути»). */
  @Get('offer')
  publicOffer(): QuestOffer {
    return this.onboarding.buildOffer();
  }

  /** Старт квеста — выдаёт сессию и блок доверия. */
  @Post('quest')
  async start(): Promise<{
    sessionId: string;
    step: 'brief';
    trust: ReadonlyArray<TrustPrinciple>;
  }> {
    const session = await this.onboarding.start();
    return { sessionId: session.id, step: 'brief', trust: this.onboarding.trust() };
  }

  @Get('quest/:id')
  async session(@Param('id') id: string): Promise<QuestProgress> {
    return this.toProgress(await this.onboarding.getSession(id));
  }

  /** Шаг 1 — «Богатырь, представься»: мини-бриф. */
  @Put('quest/:id/brief')
  async brief(
    @Param('id') id: string,
    @Body() dto: SubmitBriefDto,
  ): Promise<QuestProgress> {
    return this.toProgress(await this.onboarding.submitBrief(id, dto));
  }

  /** Шаг 2 — «Оценка дружины»: калькулятор экономии. */
  @Post('quest/:id/savings')
  @HttpCode(HttpStatus.OK)
  savings(
    @Param('id') id: string,
    @Body() dto: EstimateSavingsDto,
  ): Promise<SavingsEstimate> {
    return this.onboarding.estimateSavings(id, dto);
  }

  /** Шаг 3 — «Первый трофей»: демо-генерация поста из брифа. */
  @Post('quest/:id/demo')
  @HttpCode(HttpStatus.OK)
  async demo(@Param('id') id: string): Promise<unknown> {
    const draft = await this.onboarding.runDemo(id);
    // Усиливаем принцип доверия: контент идёт в правку, не в автопубликацию.
    return { ...draft, requiresEditBeforePublish: true };
  }

  /** Шаг 4+5 — «Выбор пути» и призыв: тарифы vs человек + триал. */
  @Get('quest/:id/offer')
  async offer(@Param('id') id: string): Promise<QuestOffer> {
    return this.onboarding.completeWithOffer(id);
  }

  private toProgress(session: QuestSession): QuestProgress {
    return {
      sessionId: session.id,
      completedSteps: session.completedSteps,
      hasBrief: Boolean(session.brief),
      savings: session.savings ?? null,
      demoDone: session.demoDone,
    };
  }
}
