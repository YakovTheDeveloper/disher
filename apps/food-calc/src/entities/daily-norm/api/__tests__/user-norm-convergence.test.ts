import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/shared/lib/dexie/schema';
import { merge } from '@/shared/lib/snapshot';
import { upsertUserNorm } from '../mutations';
import { USER_NORM_ID } from '../../model/default-norm';

// USER_NORM is a singleton keyed by a constant id. It is only ever upserted —
// never deleted, so never tombstoned. Two devices editing it converge by LWW
// (newer items win); the dev toggle's reset-to-empty leaves NO tombstone, so a
// recreated/edited norm can't be silently shadow-deleted cross-device (the
// Tier-0 trap, resolved by modelling the toggle as update/reset, not delete).

async function clearAll() {
  await Promise.all(db.tables.map((t) => t.clear()));
}

const ISO = '2026-01-01T00:00:00.000Z';

function normRow(items: Record<string, number>, updated_at: string) {
  return {
    id: USER_NORM_ID,
    name: 'Моя норма',
    description: '',
    items,
    created_at: ISO,
    updated_at,
  };
}

describe('USER_NORM singleton convergence', () => {
  beforeEach(clearAll);

  it('two devices editing the singleton converge by LWW (newer items win), no tombstone', async () => {
    await db.daily_norms.put(normRow({ '208': 1800 }, '2026-02-01T00:00:00.000Z'));

    await merge({
      daily_norms: [normRow({ '208': 2200 }, '2026-03-01T00:00:00.000Z')],
      tombstones: [],
    });

    const row = await db.daily_norms.get(USER_NORM_ID);
    expect(row?.items).toEqual({ '208': 2200 }); // newer peer edit wins
    expect(await db.tombstones.count()).toBe(0); // singleton never tombstoned
  });

  it('a stale incoming edit loses to the newer local norm', async () => {
    await db.daily_norms.put(normRow({ '208': 2200 }, '2026-03-01T00:00:00.000Z'));

    await merge({
      daily_norms: [normRow({ '208': 1800 }, '2026-02-01T00:00:00.000Z')],
      tombstones: [],
    });

    expect((await db.daily_norms.get(USER_NORM_ID))?.items).toEqual({ '208': 2200 });
  });

  it('reset-to-empty (dev toggle off) keeps the row and writes NO tombstone — no delete path', async () => {
    await upsertUserNorm({ '208': 2000 });
    await upsertUserNorm({}); // toggle off → reset, not delete

    const row = await db.daily_norms.get(USER_NORM_ID);
    expect(row).toBeTruthy();
    expect(row?.items).toEqual({});
    expect(await db.tombstones.where('id').equals(USER_NORM_ID).count()).toBe(0);
  });
});
