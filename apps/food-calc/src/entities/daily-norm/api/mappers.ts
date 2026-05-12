import type { DailyNormRow } from '@/shared/lib/dexie/schema';
import type { DailyNormItems } from '../model/types';

export function readNormItems(row: DailyNormRow | undefined): DailyNormItems {
  if (!row) return {};
  const raw = row.items;
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as DailyNormItems; } catch { return {}; }
  }
  return raw as DailyNormItems;
}
