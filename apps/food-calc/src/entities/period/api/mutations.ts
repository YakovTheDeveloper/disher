import { db, type PeriodRow } from '@/shared/lib/dexie/schema';

const now = () => new Date().toISOString();

export async function addPeriod(params: {
  name: string;
  colorIndex: number;
  fontFamily?: string;
  fontSize?: number;
}): Promise<string> {
  const id = crypto.randomUUID();
  const row: PeriodRow = {
    id,
    name: params.name.trim(),
    color_index: params.colorIndex,
    font_family: params.fontFamily ?? 'sans',
    font_size: params.fontSize ?? 16,
    created_at: now(),
  };
  await db.periods.add(row);
  return id;
}

export async function removePeriod(id: string): Promise<void> {
  await db.periods.delete(id);
}

type PeriodUpdates = Partial<{
  name: string;
  colorIndex: number;
  fontFamily: string;
  fontSize: number;
}>;

const COLUMN_MAP: Record<keyof PeriodUpdates, string> = {
  name: 'name',
  colorIndex: 'color_index',
  fontFamily: 'font_family',
  fontSize: 'font_size',
};

export async function updatePeriod(
  id: string,
  updates: PeriodUpdates,
): Promise<void> {
  const keys = Object.keys(updates) as (keyof PeriodUpdates)[];
  if (keys.length === 0) return;
  const patch: Record<string, unknown> = {};
  for (const k of keys) {
    patch[COLUMN_MAP[k]] = updates[k];
  }
  await db.periods.update(id, patch);
}
