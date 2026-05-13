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

// Persisted shape — what we keep in idb-keyval per dish.
export type DishAnalysis = {
  dishId: string;
  resultMd: string;
  createdAt: string;
};
