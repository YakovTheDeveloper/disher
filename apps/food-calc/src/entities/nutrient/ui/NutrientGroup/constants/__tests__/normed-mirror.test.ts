import { describe, expect, it } from 'vitest';
import { NORMED_NUTRIENT_IDS } from '@/shared/lib/suggest/deficit';
import { nutrientsHaveDailyNorm } from '../constants';

// Сторож зеркала: NORMED_NUTRIENT_IDS (shared/lib/suggest/deficit.ts) —
// осознанный дубль true-ключей nutrientsHaveDailyNorm (shared не может
// импортировать из entities по FSD). Тест живёт на уровне entities, где
// импорт из shared разрешён, и ловит рассинхрон при правке любого из списков.
describe('NORMED_NUTRIENT_IDS ↔ nutrientsHaveDailyNorm — зеркало', () => {
  it('множества id с дневной нормой совпадают', () => {
    const fromConstants = new Set(
      Object.entries(nutrientsHaveDailyNorm)
        .filter(([, has]) => has === true)
        .map(([id]) => id),
    );
    expect([...NORMED_NUTRIENT_IDS].sort()).toEqual([...fromConstants].sort());
  });
});
