// Single source of truth for what each AI feature costs the user, in KOPECKS
// (integer minor units — never float). Points are rubles 1:1, so 100 = 1 ₽.
//
// Flat-per-feature pricing (decided 2026-06-08): predictable for the user and
// needs no token-usage extraction from SSE streams.
// DeepSeek is cheap enough that a flat price stays margin-positive. These are
// config — tune freely, the wallet logic doesn't care about the numbers.

export const PRICES_KOP = {
  free_text_parse: 10, //  0.1 ₽ — parse freeform food text (frequent, core flow)
  free_text_event_parse: 10, //  0.1 ₽ — parse freeform health-event text (period + aspects)
  dish_suggestions: 50, //  0.5 ₽ — infer dish ingredients
  nutrient_suggestions: 50, //  0.5 ₽ — estimate a product's full nutrient profile
  daily_analysis: 200, //  2 ₽   — one-day food review (SSE)
  dish_analysis: 200, //  2 ₽   — single-dish breakdown (SSE)
  long_analysis: 500, //  5 ₽   — multi-day analysis (background job)
} as const;

export type Feature = keyof typeof PRICES_KOP;

/** Balance credited to a brand-new wallet on first touch. 50 ₽. */
export const WELCOME_GRANT_KOP = 5000;

export function isFeature(value: string): value is Feature {
  return Object.prototype.hasOwnProperty.call(PRICES_KOP, value);
}

/** Kopecks → rubles, for display only. 250 → 2.5 */
export function rubFromKop(kop: number): number {
  return Math.round(kop) / 100;
}
