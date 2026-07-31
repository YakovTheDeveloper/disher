import { describe, expect, it } from 'vitest';
import { catalog } from '@/shared/data/catalog';
import { computeDeficits, scoreSuggestions, type ProductSuggestCandidate } from '..';

// Smoke на реальном каталоге (~715 продуктов, build-артефакт): кандидаты
// строятся тем же маппингом, что в useSuggestions (парсинг portions/categories,
// nutrients как Record), и прогоняются через scoreSuggestions с типовым
// дефицитом. Ловит NaN в скоринге, пустой топ и «специи наверху» на реальных
// данных — юнит-фикстуры на синтетике этого не покрывают.

const parseCategories = (json: unknown): string[] => (Array.isArray(json) ? (json as string[]) : []);

const candidates: ProductSuggestCandidate[] = catalog.map((row) => ({
  kind: 'product',
  id: row.id,
  name: row.name,
  categories: parseCategories(row.categories),
  portions: (Array.isArray(row.portions) ? row.portions : []) as unknown as Array<{ grams: number }>,
  servingBasis: row.serving_basis ?? '100g',
  servingUnit: row.serving_unit ?? null,
  nutrients: (row.nutrients ?? {}) as unknown as Record<string, number>,
}));

// Типовой день: съедена половина БЖУ/энергии, есть дефицит кальция и витамина C.
const TYPICAL_NORMS = { '1': 70, '2': 70, '3': 300, '7': 2000, '12': 1000, '30': 90 };
const TYPICAL_CONSUMED = { '1': 35, '2': 35, '3': 150, '7': 1000 };

describe('scoreSuggestions — smoke на реальном catalog.json', () => {
  const deficits = computeDeficits(TYPICAL_CONSUMED, TYPICAL_NORMS);
  const { suggestions, normComplete } = scoreSuggestions(candidates, deficits);

  it('топ не пуст и без NaN в score/pct', () => {
    expect(normComplete).toBe(false);
    expect(suggestions.length).toBeGreaterThan(0);
    for (const s of suggestions) {
      expect(Number.isFinite(s.score)).toBe(true);
      expect(Number.isFinite(s.portionGrams)).toBe(true);
      expect(s.portionGrams).toBeGreaterThan(0);
      for (const c of s.topCovers) expect(Number.isFinite(c.pct)).toBe(true);
    }
  });

  it('выдача урезана топ-20', () => {
    expect(suggestions.length).toBeLessThanOrEqual(20);
  });

  it('специи не в топ-5 (категорийный кап порции работает на реальных данных)', () => {
    const spiceIds = new Set(
      candidates
        .filter((c) => c.categories.some((cat) => cat === 'spice' || cat === 'herb'))
        .map((c) => c.id),
    );
    const top5 = suggestions.slice(0, 5);
    expect(top5.filter((s) => spiceIds.has(s.ref.id))).toEqual([]);
  });
});
