import { db, type DailyNormRow } from '@/shared/lib/dexie/schema';
import type { DailyNormItems } from '../model/types';
import { USER_NORM_ID, USER_NORM_NAME } from '../model/default-norm';

const now = () => new Date().toISOString();

/** Create or replace the single user-norm row. */
export async function upsertUserNorm(items: DailyNormItems): Promise<void> {
  const existing = await db.daily_norms.get(USER_NORM_ID);
  const row: DailyNormRow = {
    id: USER_NORM_ID,
    name: USER_NORM_NAME,
    description: '',
    items,
    created_at: existing?.created_at ?? now(),
  };
  await db.daily_norms.put(row);
}

/** Patch items on the user-norm row. Creates the row if missing. */
export async function patchUserNormItems(items: DailyNormItems): Promise<void> {
  const existing = await db.daily_norms.get(USER_NORM_ID);
  if (!existing) {
    await upsertUserNorm(items);
    return;
  }
  await db.daily_norms.update(USER_NORM_ID, { items });
}

/** Set a single nutrient value on the user-norm; null/0 removes it. */
export async function setUserNormNutrient(
  nutrientId: string,
  quantity: number | null,
): Promise<void> {
  const existing = await db.daily_norms.get(USER_NORM_ID);
  const current = (existing?.items as DailyNormItems | undefined) ?? {};
  const next: DailyNormItems = { ...current };
  if (quantity === null || quantity === 0) {
    delete next[nutrientId];
  } else {
    next[nutrientId] = quantity;
  }
  await patchUserNormItems(next);
}
