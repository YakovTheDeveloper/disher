import { describe, expect, it } from 'vitest';
import { computeDeficits } from '../deficit';
import { CATEGORY_PORTION_CAPS, resolvePortion } from '../portion';
import { scoreSuggestions } from '../score';
import type { ProductSuggestCandidate } from '../types';

const product = (overrides: Partial<ProductSuggestCandidate>): ProductSuggestCandidate => ({
  kind: 'product',
  id: 'p1',
  name: 'Продукт',
  categories: [],
  portions: [],
  servingBasis: '100g',
  nutrients: {},
  ...overrides,
});

describe('computeDeficits', () => {
  it('считает дефицит только по нутриентам с официальной нормой', () => {
    // '5' (starch) и '34' (betaCarotene) есть в defaultDailyNorms, но официальной
    // нормы у них нет (nutrientsHaveDailyNorm = false) — они не должны попасть в результат.
    const deficits = computeDeficits({ '1': 20 }, { '1': 60, '5': 30, '34': 3000 });
    expect(deficits.map((d) => d.id)).toEqual(['1']);
    expect(deficits[0]).toEqual({ id: '1', norm: 60, consumed: 20, deficit: 40, relDeficit: 40 / 60 });
  });

  it('перебор даёт deficit = 0, но нутриент остаётся в списке (штрафует)', () => {
    const deficits = computeDeficits({ '7': 2500 }, { '7': 2000 });
    expect(deficits[0].deficit).toBe(0);
    expect(deficits[0].relDeficit).toBe(0);
  });

  it('norm <= 0 отбрасывается', () => {
    expect(computeDeficits({}, { '1': 0, '7': -5 })).toEqual([]);
  });
});

describe('resolvePortion', () => {
  it("serving_basis 'serving' — 1 порция", () => {
    expect(resolvePortion(product({ servingBasis: 'serving' }))).toBe(1);
  });

  it('первая именованная порция в приоритете над фолбэком', () => {
    expect(resolvePortion(product({ portions: [{ grams: 150 }, { grams: 200 }] }))).toBe(150);
  });

  it('категорийный кап применяется, когда порции нет', () => {
    expect(resolvePortion(product({ categories: ['spice'] }))).toBe(CATEGORY_PORTION_CAPS.spice);
    expect(resolvePortion(product({ categories: ['oil'] }))).toBe(CATEGORY_PORTION_CAPS.oil);
    expect(resolvePortion(product({ categories: ['coffee'] }))).toBe(CATEGORY_PORTION_CAPS.coffee);
  });

  it('кап clampит именованную порцию сверху', () => {
    expect(resolvePortion(product({ categories: ['herb'], portions: [{ grams: 50 }] }))).toBe(5);
  });

  it('фолбэк 100 г', () => {
    expect(resolvePortion(product({}))).toBe(100);
  });
});

describe('scoreSuggestions', () => {
  it('специя НЕ в топе при макро-дефиците (паприка vs куриная грудка, дефицит белка)', () => {
    const paprika = product({
      id: 'paprika',
      name: 'Паприка',
      categories: ['spice'],
      nutrients: { '1': 14, '7': 280 },
    });
    const chicken = product({
      id: 'chicken',
      name: 'Куриная грудка',
      categories: ['poultry'],
      portions: [{ grams: 150 }],
      nutrients: { '1': 23, '7': 120 },
    });
    const deficits = computeDeficits({ '1': 30, '7': 1500 }, { '1': 60, '7': 2000 });

    const { suggestions } = scoreSuggestions([paprika, chicken], deficits);

    expect(suggestions[0].ref.id).toBe('chicken');
    expect(resolvePortion(paprika)).toBe(5);
    expect(suggestions.find((s) => s.ref.id === 'paprika')!.portionGrams).toBe(5);
    expect(suggestions[0].score).toBeGreaterThan(suggestions[1].score);
  });

  it('кап: покрывающий дефицит ×10 не обгоняет покрывающий ровно 100%', () => {
    const over10x = product({ id: 'a', nutrients: { '30': 9000 } }); // витамин C, norm 90
    const exact = product({ id: 'b', nutrients: { '30': 90 } });
    const deficits = computeDeficits({}, { '30': 90 });

    const { suggestions } = scoreSuggestions([over10x, exact], deficits);
    const scoreA = suggestions.find((s) => s.ref.id === 'a')!.score;
    const scoreB = suggestions.find((s) => s.ref.id === 'b')!.score;

    expect(suggestions[0].ref.id).toBe('b');
    expect(scoreA).toBeLessThanOrEqual(scoreB);
    expect(scoreB).toBe(100);
  });

  it('штраф: продукт с перебором калорий ниже равного по покрытию без перебора («торт»)', () => {
    const cake = product({ id: 'cake', nutrients: { '7': 900 } });
    const bread = product({ id: 'bread', nutrients: { '7': 500 } });
    const deficits = computeDeficits({ '7': 1500 }, { '7': 2000 });

    const { suggestions } = scoreSuggestions([cake, bread], deficits);
    const scoreCake = suggestions.find((s) => s.ref.id === 'cake')!.score;
    const scoreBread = suggestions.find((s) => s.ref.id === 'bread')!.score;

    // оба закрывают дефицит на 100%, но торт уводит за норму
    expect(scoreCake).toBeLessThan(scoreBread);
    expect(scoreBread).toBe(100);
    expect(suggestions[0].ref.id).toBe('bread');
  });

  it('Dᵢ = 0 везде → пустой результат + normComplete', () => {
    const deficits = computeDeficits({ '1': 80, '7': 2500 }, { '1': 60, '7': 2000 });
    const { suggestions, normComplete } = scoreSuggestions(
      [product({ id: 'a', nutrients: { '1': 50 } })],
      deficits,
    );
    expect(suggestions).toEqual([]);
    expect(normComplete).toBe(true);
  });

  it('исключает blacklist, alcohol и кандидатов без нутриентных данных', () => {
    const deficits = computeDeficits({}, { '1': 60 });
    const { suggestions } = scoreSuggestions(
      [
        product({ id: 'banned', nutrients: { '1': 50 } }),
        product({ id: 'wine', categories: ['alcohol'], nutrients: { '1': 10 } }),
        product({ id: 'empty', nutrients: {} }),
        product({ id: 'ok', nutrients: { '1': 20 } }),
      ],
      deficits,
      { blacklist: new Set(['banned']) },
    );
    expect(suggestions.map((s) => s.ref.id)).toEqual(['ok']);
  });

  it('topCovers — топ нутриентов по доле закрываемого остатка в процентах', () => {
    const deficits = computeDeficits({}, { '1': 60, '6': 25 });
    const { suggestions } = scoreSuggestions(
      [product({ id: 'a', nutrients: { '1': 30, '6': 25 } })],
      deficits,
    );
    const covers = Object.fromEntries(suggestions[0].topCovers.map((c) => [c.nutrientId, c.pct]));
    expect(covers['6']).toBe(100); // 25 г клетчатки на 100 г закрывает дефицит целиком
    expect(covers['1']).toBe(50);
    expect(suggestions[0].topCovers[0].nutrientId).toBe('6');
  });

  it('блюдо скорится через calculateDishNutrients', () => {
    const deficits = computeDeficits({}, { '1': 30 });
    const { suggestions } = scoreSuggestions(
      [
        {
          kind: 'dish',
          id: 'd1',
          name: 'Салат',
          items: [
            { productId: 'p1', quantity: 100 },
            { productId: 'p2', quantity: 100 },
          ],
          productNutrients: new Map([
            ['p1', { '1': 10 }],
            ['p2', { '1': 20 }],
          ]),
        },
      ],
      deficits,
    );
    // база блюда 200 г, порция 100 г → (10 + 20) / 2 = 15 г белка → 50% дефицита
    expect(suggestions[0].score).toBeCloseTo(50);
    expect(suggestions[0].topCovers[0]).toEqual({ nutrientId: '1', pct: 50 });
  });

  it('исключает кандидатов с нулевым покрытием (все coverᵢ = 0)', () => {
    // Дефицит только белка; у «сахарной воды» белка нет — нутриентные данные
    // есть, но ни один дефицит порция не закрывает.
    const deficits = computeDeficits({}, { '1': 60 });
    const { suggestions } = scoreSuggestions(
      [
        product({ id: 'sugar-water', nutrients: { '4': 10, '7': 40 } }),
        product({ id: 'chicken', nutrients: { '1': 23 } }),
      ],
      deficits,
    );
    expect(suggestions.map((s) => s.ref.id)).toEqual(['chicken']);
  });

  it('отдаёт не больше TOP_SUGGESTIONS_LIMIT (20) предложений', () => {
    const deficits = computeDeficits({}, { '1': 60 });
    const candidates = Array.from({ length: 30 }, (_, i) =>
      product({ id: `p${i}`, nutrients: { '1': 20 + i } }),
    );
    const { suggestions } = scoreSuggestions(candidates, deficits);
    expect(suggestions).toHaveLength(20);
    // Сортировка по score сохранена — верх списка это самый белковый.
    expect(suggestions[0].ref.id).toBe('p29');
  });

  it("serving-сквозной: БАД → totals = доза (не 0.01), portionGrams = 1", () => {
    const deficits = computeDeficits({}, { '1': 50 });
    const { suggestions } = scoreSuggestions(
      [
        product({
          id: 'omega3',
          servingBasis: 'serving',
          servingUnit: 'капс.',
          // serving-базис: нутриенты за ДОЗУ. Баг ревью: 0.01-скейл давал
          // нулевые totals и «1 г» в подписи ряда.
          nutrients: { '1': 60 },
        }),
      ],
      deficits,
    );
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].portionGrams).toBe(1);
    expect(suggestions[0].portionUnit).toBe('капс.');
    expect(suggestions[0].nutrients['1']).toBe(60);
    expect(suggestions[0].topCovers[0]).toEqual({ nutrientId: '1', pct: 100 });
  });

  it('блюдо с именованной порцией 350 г → portionGrams 350', () => {
    const deficits = computeDeficits({}, { '1': 30 });
    const { suggestions } = scoreSuggestions(
      [
        {
          kind: 'dish',
          id: 'd1',
          name: 'Салат',
          portions: [{ grams: 350 }],
          items: [{ productId: 'p1', quantity: 100 }],
          productNutrients: new Map([['p1', { '1': 20 }]]),
        },
      ],
      deficits,
    );
    expect(suggestions[0].portionGrams).toBe(350);
    // 20 г белка на 100 г блюда × 350 г = 70 г → дефицит закрыт на 100%.
    expect(suggestions[0].topCovers[0]).toEqual({ nutrientId: '1', pct: 100 });
  });
});
