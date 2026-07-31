import type { SuggestCandidate } from './types';

/**
 * Категорийные капы порции (по мотивам FDA RACC, 21 CFR 101.12) — защита от
 * «специй наверху»: 5 г паприки физически не закроют дефицит белка, даже если
 * per-100 г у неё высокая плотность.
 */
export const CATEGORY_PORTION_CAPS: Record<string, number> = {
  spice: 5,
  herb: 5,
  condiment: 5,
  oil: 15,
  coffee: 10,
};

const FALLBACK_PORTION_GRAMS = 100;

/**
 * Реалистичная порция в граммах. Без яруса «медиана истории пользователя»
 * (осознанное решение — история хрупкая у новых юзеров). Приоритет:
 *   1. serving_basis 'serving' (БАДы) — 1 порция;
 *   2. первая именованная порция каталога/dish_portions;
 *   3. категорийный кап;
 *   4. фолбэк 100 г.
 * Категорийный кап — именно кап: именованная порция специи/масла сверх капа
 * clampится до него.
 */
export function resolvePortion(candidate: SuggestCandidate): number {
  if (candidate.kind === 'product' && candidate.servingBasis === 'serving') return 1;

  const firstPortion = candidate.portions?.[0]?.grams;
  const cap =
    candidate.kind === 'product'
      ? candidate.categories.reduce<number | undefined>(
          (acc, c) => acc ?? CATEGORY_PORTION_CAPS[c],
          undefined,
        )
      : undefined;

  const base = firstPortion ?? cap ?? FALLBACK_PORTION_GRAMS;
  return cap !== undefined ? Math.min(base, cap) : base;
}
