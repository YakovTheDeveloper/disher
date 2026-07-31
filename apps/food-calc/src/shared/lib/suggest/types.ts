import type { NutrientTotals, ServingBasis } from '../nutrients';

export interface SuggestRef {
  kind: 'product' | 'dish';
  id: string;
  name: string;
}

export interface ProductSuggestCandidate {
  kind: 'product';
  id: string;
  name: string;
  categories: string[];
  portions: Array<{ grams: number }>;
  servingBasis: ServingBasis;
  /** Юнит дозы БАД («капс.», «таб.») — протягивается в Suggestion.portionUnit,
   *  чтобы ряду не нужен per-row lookup продукта. */
  servingUnit?: string | null;
  /** Нутриенты на 100 г (или на порцию при servingBasis 'serving'), id → quantity. */
  nutrients: Record<string, number>;
}

export interface DishSuggestCandidate {
  kind: 'dish';
  id: string;
  name: string;
  /** Именованные порции блюда (dish_portions); пусто — фолбэк 100 г. */
  portions?: Array<{ grams: number }>;
  items: Array<{ productId: string; quantity: number }>;
  /** Нутриенты ингредиентов на 100 г: productId → (nutrientId → quantity). */
  productNutrients: Map<string, Record<string, number>>;
}

export type SuggestCandidate = ProductSuggestCandidate | DishSuggestCandidate;

export interface Suggestion {
  ref: SuggestRef;
  portionGrams: number;
  /** Юнит порции для подписи ряда («капс.» у БАД); пусто → фолбэк «г». */
  portionUnit?: string;
  score: number;
  /** Топ-3 нутриента по доле закрываемого остатка, pct в процентах (0–100]. */
  topCovers: Array<{ nutrientId: string; pct: number }>;
  /** Нутриенты кандидата в реалистичной порции. */
  nutrients: NutrientTotals;
}
