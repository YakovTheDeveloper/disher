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
