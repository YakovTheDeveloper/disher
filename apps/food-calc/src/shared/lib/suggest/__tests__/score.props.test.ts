import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { scoreNutrientTotals } from '../score';
import type { Deficit } from '../deficit';

// Алгебраические свойства формулы скоринга — по образцу merge.props.test.ts.
// Зелёное свойство = то, что формула genuinely гарантирует; красное — регрессия.

const NUM_RUNS = Number(process.env.FC_NUM_RUNS) || 50;
const runs = { numRuns: NUM_RUNS };

const arbDeficit: fc.Arbitrary<Deficit> = fc
  .record({
    id: fc.constantFrom('1', '2', '3', '7', '30'),
    norm: fc.double({ min: 0.001, max: 10_000, noNaN: true }),
    consumed: fc.double({ min: 0, max: 20_000, noNaN: true }),
  })
  .map(({ id, norm, consumed }) => {
    const deficit = Math.max(norm - consumed, 0);
    return { id, norm, consumed, deficit, relDeficit: deficit / norm };
  });

const arbTotals = fc.dictionary(
  fc.constantFrom('1', '2', '3', '7', '30'),
  fc.double({ min: 0, max: 1e6, noNaN: true }),
);

describe('scoreNutrientTotals — свойства', () => {
  it('score всегда в [0, 100] и не NaN на произвольных входах', () => {
    fc.assert(
      fc.property(fc.array(arbDeficit, { maxLength: 5 }), arbTotals, (deficits, totals) => {
        const score = scoreNutrientTotals(totals, deficits);
        expect(score).not.toBeNaN();
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }),
      runs,
    );
  });

  it('монотонность по росту порции до капа: больше продукта — не меньше score, пока s ≤ D', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 100, noNaN: true }), // нутриент на 100 г
        fc.double({ min: 1, max: 500, noNaN: true }), // порция 1
        fc.double({ min: 0, max: 500, noNaN: true }), // добавка к порции
        (per100, p1, delta) => {
          const p2 = p1 + delta;
          // дефицит заведомо не меньше большей порции — оба значения до капа
          const norm = (per100 * p2) / 100 + 1;
          const deficits: Deficit[] = [
            { id: '1', norm, consumed: 0, deficit: norm, relDeficit: 1 },
          ];
          const score1 = scoreNutrientTotals({ '1': (per100 * p1) / 100 }, deficits);
          const score2 = scoreNutrientTotals({ '1': (per100 * p2) / 100 }, deficits);
          expect(score2).toBeGreaterThanOrEqual(score1);
        },
      ),
      runs,
    );
  });

  it('после капа рост порции не увеличивает score (может только штрафовать)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 100, noNaN: true }),
        fc.double({ min: 1, max: 100, noNaN: true }),
        (per100, norm) => {
          const exactPortion = (norm / per100) * 100; // порция, покрывающая ровно 100%
          const doublePortion = exactPortion * 2;
          const deficits: Deficit[] = [
            { id: '1', norm, consumed: 0, deficit: norm, relDeficit: 1 },
          ];
          const atCap = scoreNutrientTotals({ '1': per100 * (exactPortion / 100) }, deficits);
          const beyond = scoreNutrientTotals({ '1': per100 * (doublePortion / 100) }, deficits);
          expect(atCap).toBeCloseTo(100, 10);
          expect(beyond).toBeLessThanOrEqual(atCap);
        },
      ),
      runs,
    );
  });
});
