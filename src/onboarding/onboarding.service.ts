import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntitlementService } from '../billing/entitlement.service';
import { Tariff } from '../billing/tariff';
import { toTariffPlanDto, TariffPlanDto } from '../billing/tariff.dto';
import { ContentService, DraftResult } from '../modules/content/content.service';
import {
  QUEST_SESSION_STORE,
  QuestSessionStore,
} from './quest-session.store';
import { SavingsCalculator } from './savings.calculator';
import {
  BusinessBrief,
  QuestSession,
  QuestStep,
  SavingsEstimate,
} from './quest.types';
import { SubmitBriefDto } from './dto/submit-brief.dto';
import { EstimateSavingsDto } from './dto/estimate-savings.dto';
import {
  ALTERNATIVE_COSTS,
  TRIAL_OFFER,
  TRUST_BLOCK,
  TrustPrinciple,
} from './onboarding.config';

export interface QuestOffer {
  tariffs: TariffPlanDto[];
  /** Сравнение с человеком (фрилансер/агентство), не с другими SaaS (spec п.7). */
  alternatives: Array<{
    type: string;
    label: string;
    monthlyCostRub: { low: number; high: number };
  }>;
  timesCheaperVsHuman: { low: number; high: number };
  cta: typeof TRIAL_OFFER;
}

/**
 * Оркестрация «богатырского квеста» (spec п.7). Шаги пишутся в сессию, чтобы
 * демо-генерация опиралась на бриф, а прогресс был виден.
 */
@Injectable()
export class OnboardingService {
  constructor(
    @Inject(QUEST_SESSION_STORE) private readonly store: QuestSessionStore,
    private readonly savings: SavingsCalculator,
    private readonly entitlements: EntitlementService,
    private readonly content: ContentService,
  ) {}

  start(): Promise<QuestSession> {
    return this.store.create();
  }

  async getSession(id: string): Promise<QuestSession> {
    const session = await this.store.get(id);
    if (!session) {
      throw new NotFoundException('Сессия квеста не найдена.');
    }
    return session;
  }

  trust(): ReadonlyArray<TrustPrinciple> {
    return TRUST_BLOCK;
  }

  /** Шаг 1 — мини-бриф. */
  async submitBrief(
    id: string,
    dto: SubmitBriefDto,
  ): Promise<QuestSession> {
    const session = await this.getSession(id);
    const brief: BusinessBrief = { ...dto };
    session.brief = brief;
    this.markStep(session, 'brief');
    await this.store.save(session);
    return session;
  }

  /** Шаг 2 — калькулятор экономии. */
  async estimateSavings(
    id: string,
    dto: EstimateSavingsDto,
  ): Promise<SavingsEstimate> {
    const session = await this.getSession(id);
    // Сравниваем с топ-тарифом — он закрывает весь объём работы человека.
    const tariff = this.entitlements.getPlan(Tariff.Bogatyr);
    const estimate = this.savings.estimate(
      dto.hoursPerWeek,
      tariff,
      dto.hourlyRateRub,
    );
    session.savings = estimate;
    this.markStep(session, 'savings');
    await this.store.save(session);
    return estimate;
  }

  /** Шаг 3 — «первый трофей»: демо-генерация поста из брифа. */
  async runDemo(id: string): Promise<DraftResult> {
    const session = await this.getSession(id);
    if (!session.brief) {
      throw new BadRequestException(
        'Сначала заполните бриф (шаг 1) — без ниши не на чём строить демо.',
      );
    }

    // Демо — без тарифа/лимита: задача шага закрыть барьер «не вижу результата».
    // [TODO] Защита от злоупотреблений: rate-limit демо по IP/сессии.
    const draft = await this.content.generateDrafts({
      niche: session.brief.niche,
      topic: session.brief.goal ?? 'Знакомство с бизнесом и приглашение клиентов',
      // Короткое вертикальное видео — максимальный охват (spec п.6).
      format: 'short_video',
    });

    session.demoDone = true;
    this.markStep(session, 'demo');
    await this.store.save(session);
    return draft;
  }

  /** Шаг 4+5 в рамках сессии: помечает финальный шаг и отдаёт оффер. */
  async completeWithOffer(id: string): Promise<QuestOffer> {
    const session = await this.getSession(id);
    this.markStep(session, 'offer');
    await this.store.save(session);
    return this.buildOffer();
  }

  /** Тарифы vs человек + оффер триала. Публично (для лендинга). */
  buildOffer(): QuestOffer {
    const tariffs = this.entitlements.listPlans().map(toTariffPlanDto);
    const topPrice = this.entitlements.getPlan(Tariff.Bogatyr).priceRub;

    return {
      tariffs,
      alternatives: [
        {
          type: 'freelancer',
          label: 'SMM-фрилансер',
          monthlyCostRub: { ...ALTERNATIVE_COSTS.freelancer },
        },
        {
          type: 'agency',
          label: 'Агентство',
          monthlyCostRub: { ...ALTERNATIVE_COSTS.agency },
        },
      ],
      timesCheaperVsHuman: {
        low: Math.round(ALTERNATIVE_COSTS.freelancer.low / topPrice),
        high: Math.round(ALTERNATIVE_COSTS.agency.high / topPrice),
      },
      cta: TRIAL_OFFER,
    };
  }

  private markStep(session: QuestSession, step: QuestStep): void {
    if (!session.completedSteps.includes(step)) {
      session.completedSteps.push(step);
    }
  }
}
