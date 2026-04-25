export interface Product {
  id: string;
  userId: string | null;
  name: string;
  nameEng: string;
  description: string;
  descriptionEng: string;
  source: string;
  pricePerKg: number;
  // jsonb columns arrive as serialized strings from PowerSync.
  nutrients: string;
  portions: string;
  categories: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type ProductNutrient = { nutrientId: string; quantity: number };
export type ProductPortion = { label: string; amount: number; unit: string; grams: number };

export type ProductWithNutrients = Product & {
  nutrients?: Map<string, ProductNutrient>;
  portions?: ProductPortion[];
};
