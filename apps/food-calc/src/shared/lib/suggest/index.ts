export { computeDeficits, defaultHasDailyNorm, NORMED_NUTRIENT_IDS, type Deficit } from './deficit';
export { resolvePortion, CATEGORY_PORTION_CAPS } from './portion';
export {
  scoreNutrientTotals,
  scoreSuggestions,
  OVER_PENALTY_LAMBDA,
  TOP_SUGGESTIONS_LIMIT,
  type ScoreSuggestionsOptions,
  type ScoreSuggestionsResult,
} from './score';
export type {
  DishSuggestCandidate,
  ProductSuggestCandidate,
  SuggestCandidate,
  SuggestRef,
  Suggestion,
} from './types';
