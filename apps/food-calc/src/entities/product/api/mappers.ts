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
    source: row.source,
    nutrients: stringifyJson(row.nutrients, '{}'),
    portions: stringifyJson(row.portions, '[]'),
    categories: stringifyJson(row.categories, '[]'),
    servingBasis: row.serving_basis ?? '100g',
    servingUnit: row.serving_unit ?? null,
    // `?? ''` covers snapshot pulls from devices that dumped before `description`
    // existed. Local writes always include it.
    description: row.description ?? '',
    createdAt: row.created_at,
  };
}
