import type { ProductRow } from '@/shared/lib/dexie/schema';
import type { Product } from '../model/types';

function stringifyJson(value: unknown, fallback: string): string {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

export function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    nameEng: row.name_eng,
    description: row.description,
    descriptionEng: row.description_eng,
    source: row.source,
    pricePerKg: row.price_per_kg,
    nutrients: stringifyJson(row.nutrients, '{}'),
    portions: stringifyJson(row.portions, '[]'),
    categories: stringifyJson(row.categories, '[]'),
    servingBasis: row.serving_basis ?? '100g',
    servingUnit: row.serving_unit ?? null,
    createdAt: row.created_at,
  };
}
