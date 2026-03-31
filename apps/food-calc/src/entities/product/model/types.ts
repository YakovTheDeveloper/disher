import type { tables } from '@/livestore/schema'

type ProductRow = (typeof tables)['products']['Type']

export type Product = ProductRow
export type ProductNutrient = { nutrientId: string; quantity: number }
export type ProductPortion = { label: string; amount: number; unit: string; grams: number }

export type ProductWithNutrients = Product & {
  nutrients?: Map<string, ProductNutrient>;
  portions?: ProductPortion[];
};
