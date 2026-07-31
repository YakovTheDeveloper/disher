import {
  calculateDishNutrients,
  calculateProductNutrients,
  type NutrientEntry,
  type NutrientTotals,
} from '../nutrients';
import type { Deficit } from './deficit';
import { resolvePortion } from './portion';
import type { SuggestCandidate, Suggestion } from './types';

/** Штраф за перебор нормы (λ). Значение — дефолт плана, калибровка на реальных данных. */
export const OVER_PENALTY_LAMBDA = 1.5;

/** Сколько предложений отдаём в UI: скоринг считается по всем кандидатам,
 *  показываем верхнюю двадцатку (ревью 2026-07-31 — длинный хвост не нужен). */
export const TOP_SUGGESTIONS_LIMIT = 20;

const TOP_COVERS_LIMIT = 3;

const clampScore = (score: number): number => Math.min(Math.max(score, 0), 100);

const toEntries = (nutrients: Record<string, number>): NutrientEntry[] =>
  Object.entries(nutrients).map(([nutrientId, quantity]) => ({ nutrientId, quantity }));

/**
 * Формула эффективности (MAR/MER, кап покрытия как в NRF9.3):
 *   coverᵢ = min(sᵢ, Dᵢ)/Dᵢ      — доля остатка, закрываемая порцией (кап 100%)
 *   overᵢ  = max(sᵢ − Dᵢ, 0)/Tᵢ  — перебор относительно дневной нормы
 *   Score  = 100·(Σ wᵢ·coverᵢ/Σ wᵢ) − λ·Σ overᵢ,   wᵢ = Dᵢ/Tᵢ
 * Нутриенты с Dᵢ = 0 участвуют только штрафом. Итог клампится в [0, 100].
 */
export function scoreNutrientTotals(
  totals: NutrientTotals,
  deficits: Deficit[],
  lambda: number = OVER_PENALTY_LAMBDA,
): number {
  let weightSum = 0;
  let coverSum = 0;
  let overSum = 0;

  for (const d of deficits) {
    const s = totals[d.id] ?? 0;
    if (d.deficit > 0) {
      coverSum += d.relDeficit * (Math.min(s, d.deficit) / d.deficit);
      weightSum += d.relDeficit;
    }
    overSum += Math.max(s - d.deficit, 0) / d.norm;
  }

  if (weightSum === 0) return 0;
  return clampScore((100 * coverSum) / weightSum - lambda * overSum);
}

export interface ScoreSuggestionsOptions {
  /** Id кандидатов, которых не предлагать (blacklist шага 2). */
  blacklist?: ReadonlySet<string>;
  lambda?: number;
}

export interface ScoreSuggestionsResult {
  suggestions: Suggestion[];
  /** Дефицитов нет вообще — UI показывает «норма дня выполнена», а не список. */
  normComplete: boolean;
}

export function scoreSuggestions(
  candidates: SuggestCandidate[],
  deficits: Deficit[],
  opts: ScoreSuggestionsOptions = {},
): ScoreSuggestionsResult {
  const lambda = opts.lambda ?? OVER_PENALTY_LAMBDA;

  if (deficits.every((d) => d.deficit === 0)) {
    return { suggestions: [], normComplete: true };
  }

  const suggestions: Suggestion[] = [];

  for (const candidate of candidates) {
    if (opts.blacklist?.has(candidate.id)) continue;
    if (candidate.kind === 'product' && candidate.categories.includes('alcohol')) continue;

    const portionGrams = resolvePortion(candidate);
    const totals =
      candidate.kind === 'product'
        ? calculateProductNutrients(toEntries(candidate.nutrients), portionGrams, candidate.servingBasis)
        : calculateDishNutrients(
            candidate.items,
            new Map(
              [...candidate.productNutrients].map(([productId, n]) => [productId, toEntries(n)]),
            ),
            portionGrams,
          );

    // Кандидат без нутриентных данных не может ничего закрыть — исключаем.
    if (!Object.values(totals).some((v) => v > 0)) continue;

    // Нулевое покрытие: порция не закрывает НИ ОДИН дефицит (все coverᵢ = 0) —
    // кандидат лишь штрафуется за перебор, предлагать его бессмысленно.
    if (!deficits.some((d) => d.deficit > 0 && (totals[d.id] ?? 0) > 0)) continue;

    const score = scoreNutrientTotals(totals, deficits, lambda);

    const topCovers = deficits
      .filter((d) => d.deficit > 0 && (totals[d.id] ?? 0) > 0)
      .map((d) => ({
        nutrientId: d.id,
        pct: (Math.min(totals[d.id], d.deficit) / d.deficit) * 100,
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, TOP_COVERS_LIMIT);

    suggestions.push({
      ref: { kind: candidate.kind, id: candidate.id, name: candidate.name },
      portionGrams,
      portionUnit: candidate.kind === 'product' ? (candidate.servingUnit ?? undefined) : undefined,
      score,
      topCovers,
      nutrients: totals,
    });
  }

  suggestions.sort((a, b) => b.score - a.score);
  return { suggestions: suggestions.slice(0, TOP_SUGGESTIONS_LIMIT), normComplete: false };
}
