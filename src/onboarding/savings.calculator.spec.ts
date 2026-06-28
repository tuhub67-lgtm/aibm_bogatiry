import { SavingsCalculator } from './savings.calculator';
import { TARIFF_CATALOG } from '../billing/tariff-catalog.config';
import { Tariff } from '../billing/tariff';

describe('SavingsCalculator', () => {
  const calc = new SavingsCalculator();
  const bogatyr = TARIFF_CATALOG[Tariff.Bogatyr];

  it('15 ч/нед → 60 ч/мес и 18 000–30 000 ₽ (ставка 300–500, spec)', () => {
    const est = calc.estimate(15, bogatyr);
    expect(est.monthlyHoursSaved).toBe(60);
    expect(est.moneyEquivalentRub).toEqual({ low: 18_000, high: 30_000 });
  });

  it('считает «во сколько раз дешевле» относительно цены тарифа', () => {
    const est = calc.estimate(15, bogatyr);
    // 18000/1990 ≈ 9, 30000/1990 ≈ 15
    expect(est.timesCheaper).toEqual({ low: 9, high: 15 });
    expect(est.comparedTariff.priceRub).toBe(1990);
  });

  it('своя ставка переопределяет диапазон', () => {
    const est = calc.estimate(10, bogatyr, 400);
    // 10 * 4 * 400 = 16000 для обеих границ
    expect(est.moneyEquivalentRub).toEqual({ low: 16_000, high: 16_000 });
  });
});
