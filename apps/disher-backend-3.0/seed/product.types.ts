/**
 * Product type for food catalog
 * Generated from combined-foods-final.json
 */

export interface ProductPortion {
  label: string;
  labelEng: string;
  amount: number;
  unit: string;
  grams: number;
}

export interface Product {
  id: string;
  name: string;
  source?: string;
  categories: string[];
  nutrients: Record<string, number>;
  portions: ProductPortion[];
}

export type ProductCatalog = Product[];
