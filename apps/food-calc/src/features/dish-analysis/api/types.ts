import type { AnalysisInsight } from '@/features/analysis/api';

export type DishAnalysisIngredient = {
  name: string;
  grams: number;
  details: string;
};

export type DishAnalysisPayload = {
  dishId: string;
  dishName: string;
  totalGrams: number;
  ingredients: DishAnalysisIngredient[];
};

// Persisted shape — the structured result kept in idb-keyval per dish. Was
// `{ resultMd }` (markdown stream) until 2026-06-14; now a structured разбор
// (summary + valent insights) rendered by the shared AnalysisResult. A dish has
// no hypotheses, so none are stored.
export type DishAnalysis = {
  dishId: string;
  summary: string;
  insights: AnalysisInsight[];
  createdAt: string;
};
