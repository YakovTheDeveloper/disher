/** '100g' = nutrients-per-100g (food). 'serving' = nutrients-per-serving (supplements). */
export type ServingBasis = '100g' | 'serving';

/** Unit of one "quantity" tick. null = граммы (food default). */
export type ServingUnit = 'IU' | 'mg' | 'mcg' | 'g' | 'шт';

export interface Product {
  id: string;
  name: string;
  nameEng: string;
  description: string;
  descriptionEng: string;
  source: string;
  pricePerKg: number;
  // jsonb columns are kept as serialized strings for the UI parsers.
  nutrients: string;
  portions: string;
  categories: string;
  servingBasis: ServingBasis;
  servingUnit: ServingUnit | null;
  createdAt: string;
}

export type ProductNutrient = { nutrientId: string; quantity: number };
export type ProductPortion = { label: string; amount: number; unit: string; grams: number };

export type ProductWithNutrients = Product & {
  nutrients?: Map<string, ProductNutrient>;
  portions?: ProductPortion[];
};
