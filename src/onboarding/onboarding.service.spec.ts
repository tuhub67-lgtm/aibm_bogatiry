import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { InMemoryQuestSessionStore } from './quest-session.store';
import { SavingsCalculator } from './savings.calculator';
import { EntitlementService } from '../billing/entitlement.service';
import { InMemoryUsageRepository } from '../billing/usage/in-memory-usage.repository';
import { ContentService } from '../modules/content/content.service';

describe('OnboardingService', () => {
  function makeService(): {
    service: OnboardingService;
    content: ContentService & { generateDrafts: jest.Mock };
  } {
    const content = {
      generateDrafts: jest.fn().mockResolvedValue({
        variants: ['v1'],
        outline: ['o'],
        guidance: 'g',
        provider: 'fake',
        model: 'm',
      }),
    } as unknown as ContentService & { generateDrafts: jest.Mock };

    const service = new OnboardingService(
      new InMemoryQuestSessionStore(),
      new SavingsCalculator(),
      new EntitlementService(new InMemoryUsageRepository()),
      content,
    );
    return { service, content };
  }

  it('стартует сессию без выполненных шагов', async () => {
    const { service } = makeService();
    const session = await service.start();
    expect(session.id).toBeTruthy();
    expect(session.completedSteps).toEqual([]);
  });

  it('неизвестная сессия → NotFound', async () => {
    const { service } = makeService();
    await expect(service.getSession('нет')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('бриф → шаг отмечен, демо использует нишу из брифа', async () => {
    const { service, content } = makeService();
    const { id } = await service.start();

    await service.submitBrief(id, { niche: 'барбершоп', pain: 'мало клиентов' });
    const draft = await service.runDemo(id);

    expect(content.generateDrafts).toHaveBeenCalledWith(
      expect.objectContaining({ niche: 'барбершоп', format: 'short_video' }),
    );
    expect(draft.variants).toEqual(['v1']);

    const session = await service.getSession(id);
    expect(session.completedSteps).toEqual(['brief', 'demo']);
    expect(session.demoDone).toBe(true);
  });

  it('демо без брифа → BadRequest', async () => {
    const { service } = makeService();
    const { id } = await service.start();
    await expect(service.runDemo(id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('калькулятор экономии пишет результат в сессию', async () => {
    const { service } = makeService();
    const { id } = await service.start();
    const estimate = await service.estimateSavings(id, { hoursPerWeek: 15 });
    expect(estimate.moneyEquivalentRub.low).toBe(18_000);

    const session = await service.getSession(id);
    expect(session.completedSteps).toContain('savings');
  });

  it('оффер сравнивает с человеком (3 тарифа + фрилансер/агентство)', () => {
    const { service } = makeService();
    const offer = service.buildOffer();
    expect(offer.tariffs).toHaveLength(3);
    expect(offer.alternatives.map((a) => a.type)).toEqual([
      'freelancer',
      'agency',
    ]);
    // 30000/1990 ≈ 15 ... 150000/1990 ≈ 75
    expect(offer.timesCheaperVsHuman).toEqual({ low: 15, high: 75 });
  });
});
