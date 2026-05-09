import type { DailyNormRow } from '@/shared/lib/dexie/schema';
import type { DailyNorm } from '../model/types';

function stringifyItems(value: unknown): string {
  if (value == null) return '{}';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

export function mapDailyNormRow(row: DailyNormRow): DailyNorm {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    items: stringifyItems(row.items),
    createdAt: row.created_at,
  };
}
