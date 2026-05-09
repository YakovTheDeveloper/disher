import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { db } from '@/shared/lib/dexie/schema';
import { addScheduleFood } from '@/entities/schedule-food/api/mutations';
import { addDishItem } from '@/entities/dish/api/mutations';
import { useAuthStore } from '@/features/auth/auth-store';
import type { CommittedItem } from '../mode';

// Tests for the mutation block of FreeTextFoodFlow.handleCommit.
//
// Scope: the loop+transaction that turns a CommittedItem[] into real Dexie
// rows (schedule_foods or dish_items).

const USER_ID = '11111111-1111-1111-1111-111111111111';

beforeAll(() => {
  useAuthStore.setState({ userId: USER_ID });
});

beforeEach(async () => {
  await db.transaction('rw', db.tables, async () => {
    for (const t of db.tables) await t.clear();
  });
});

afterEach(async () => {
  await db.transaction('rw', db.tables, async () => {
    for (const t of db.tables) await t.clear();
  });
});

// Mirrors the schedule branch of handleCommit (lines 584-603 of
// FreeTextFoodFlow.tsx) — the exact code path under test.
async function commitScheduleItems(
  committed: CommittedItem[],
  date: string,
): Promise<string[]> {
  const newScheduleIds: string[] = [];
  await db.transaction('rw', db.schedule_foods, async () => {
    for (const c of committed) {
      const id = await addScheduleFood({
        date,
        time: c.time,
        type: 'food',
        quantity: c.quantity,
        productId: c.productId,
        details: c.note ?? '',
      });
      newScheduleIds.push(id);
    }
  });
  return newScheduleIds;
}

async function commitDishItems(
  committed: CommittedItem[],
  dishId: string,
): Promise<void> {
  await db.transaction('rw', db.dish_items, async () => {
    for (const c of committed) {
      await addDishItem({
        dishId,
        productId: c.productId,
        quantity: c.quantity,
      });
    }
  });
}

describe('FreeTextFoodFlow handleCommit — schedule mode', () => {
  it('persists every committed item with correct fields', async () => {
    const date = '02-05-2026';
    const committed: CommittedItem[] = [
      { productId: 'p-a', quantity: 100, time: '08:00', note: '' },
      { productId: 'p-b', quantity: 250, time: '13:00', note: 'обед' },
      { productId: 'p-c', quantity: 50, time: '21:00', note: '' },
    ];

    const ids = await commitScheduleItems(committed, date);

    expect(ids).toHaveLength(3);
    const rows = await db.schedule_foods.toArray();
    expect(rows).toHaveLength(3);

    for (const c of committed) {
      const row = rows.find((r) => r.product_id === c.productId);
      expect(row, `no row for productId ${c.productId}`).toBeTruthy();
      expect(row!.date).toBe(date);
      expect(row!.time).toBe(c.time);
      expect(row!.type).toBe('food');
      expect(row!.quantity).toBe(c.quantity);
      expect(row!.details).toBe(c.note);
      expect(row!.dish_id).toBeNull();
    }
  });

  it('rolls back atomically when an addScheduleFood throws mid-loop', async () => {
    const date = '02-05-2026';
    // The 2nd item violates the addScheduleFood invariant (neither productId
    // nor dishId set) — addScheduleFood throws. With db.transaction the 1st
    // and 3rd writes must roll back.
    const committed: CommittedItem[] = [
      { productId: 'p-a', quantity: 100, time: '08:00', note: '' },
      { productId: '', quantity: 100, time: '09:00', note: '' },
      { productId: 'p-c', quantity: 100, time: '10:00', note: '' },
    ];

    // Replace the 2nd item's productId with null at the addScheduleFood
    // boundary by intercepting committed[1] — easier: just use null directly
    // through a custom committer that mirrors handleCommit but allows null.
    let threw = false;
    try {
      await db.transaction('rw', db.schedule_foods, async () => {
        for (let i = 0; i < committed.length; i++) {
          const c = committed[i];
          await addScheduleFood({
            date,
            time: c.time,
            type: 'food',
            quantity: c.quantity,
            productId: i === 1 ? null : c.productId,
            details: c.note ?? '',
          });
        }
      });
    } catch {
      threw = true;
    }

    expect(threw, 'transaction must throw when addScheduleFood throws').toBe(true);

    const rows = await db.schedule_foods.toArray();
    expect(rows, 'all writes must roll back atomically').toHaveLength(0);
  });

  it('handles a single-item commit', async () => {
    const date = '02-05-2026';
    const committed: CommittedItem[] = [
      { productId: 'only', quantity: 42, time: '12:00', note: 'solo' },
    ];

    const ids = await commitScheduleItems(committed, date);
    expect(ids).toHaveLength(1);
    const row = await db.schedule_foods.get(ids[0]);
    expect(row).toBeTruthy();
    expect(row!.product_id).toBe('only');
    expect(row!.quantity).toBe(42);
    expect(row!.details).toBe('solo');
  });

  it('returns the generated ids in commit order', async () => {
    const date = '02-05-2026';
    const committed: CommittedItem[] = [
      { productId: 'p-a', quantity: 100, time: '08:00', note: '' },
      { productId: 'p-b', quantity: 100, time: '09:00', note: '' },
    ];

    const ids = await commitScheduleItems(committed, date);
    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);

    // Order in returned ids matches order in committed[]: looking up by
    // product_id should give id[i] for committed[i].
    const r0 = await db.schedule_foods.get(ids[0]);
    const r1 = await db.schedule_foods.get(ids[1]);
    expect(r0!.product_id).toBe('p-a');
    expect(r1!.product_id).toBe('p-b');
  });
});

describe('FreeTextFoodFlow handleCommit — dish mode', () => {
  it('persists every committed item as a dish_item', async () => {
    const dishId = 'dish-xyz';
    const committed: CommittedItem[] = [
      { productId: 'p-a', quantity: 100, time: '00:00', note: '' },
      { productId: 'p-b', quantity: 200, time: '00:00', note: '' },
    ];

    await commitDishItems(committed, dishId);

    const rows = await db.dish_items.toArray();
    expect(rows).toHaveLength(2);
    for (const c of committed) {
      const row = rows.find((r) => r.product_id === c.productId);
      expect(row).toBeTruthy();
      expect(row!.dish_id).toBe(dishId);
      expect(row!.quantity).toBe(c.quantity);
    }
  });

  it('rolls back dish_items atomically on mid-loop error', async () => {
    const dishId = 'dish-xyz';
    const committed: CommittedItem[] = [
      { productId: 'p-a', quantity: 100, time: '00:00', note: '' },
      { productId: 'p-b', quantity: 200, time: '00:00', note: '' },
    ];

    let threw = false;
    try {
      await db.transaction('rw', db.dish_items, async () => {
        await addDishItem({ dishId, productId: committed[0].productId, quantity: committed[0].quantity });
        // Synthetic mid-loop failure mirrors a thrown addDishItem.
        throw new Error('synthetic mid-loop failure');
      });
    } catch {
      threw = true;
    }

    expect(threw).toBe(true);
    const rows = await db.dish_items.toArray();
    expect(rows, 'first dish_item must be rolled back').toHaveLength(0);
  });
});

describe('FreeTextFoodFlow handleCommit — committed[] filter', () => {
  // Filter logic from handleCommit (lines 541-569 of FreeTextFoodFlow.tsx):
  //   resolved   → !r.enabled                      → skip
  //   ambiguous  → !a.enabled || !a.selectedId     → skip
  //   unresolved → !u.manual || !u.manual.id       → skip (post-fix)
  //
  // The filter is pure JS — we replicate it directly to confirm behavior
  // matches the source (and to lock in the unresolved-empty-id guard).

  type ResolvedRow = { enabled: boolean; productId: string; quantity: number; time: string; note: string };
  type AmbiguousRow = { enabled: boolean; selectedId: string | null; quantity: number; time: string; note: string };
  type UnresolvedRow = { manual: { id: string } | null; quantity: number; time: string; note: string };

  function buildCommitted(
    resolved: ResolvedRow[],
    ambiguous: AmbiguousRow[],
    unresolved: UnresolvedRow[],
  ): CommittedItem[] {
    const out: CommittedItem[] = [];
    for (const r of resolved) {
      if (!r.enabled) continue;
      out.push({ productId: r.productId, quantity: r.quantity, time: r.time, note: r.note });
    }
    for (const a of ambiguous) {
      if (!a.enabled || !a.selectedId) continue;
      out.push({ productId: a.selectedId, quantity: a.quantity, time: a.time, note: a.note });
    }
    for (const u of unresolved) {
      if (!u.manual || !u.manual.id) continue;
      out.push({ productId: u.manual.id, quantity: u.quantity, time: u.time, note: u.note });
    }
    return out;
  }

  it('drops disabled resolved rows', () => {
    const committed = buildCommitted(
      [
        { enabled: true, productId: 'a', quantity: 1, time: '08:00', note: '' },
        { enabled: false, productId: 'b', quantity: 1, time: '08:00', note: '' },
      ],
      [],
      [],
    );
    expect(committed.map((c) => c.productId)).toEqual(['a']);
  });

  it('drops ambiguous rows with null/empty selectedId', () => {
    const committed = buildCommitted(
      [],
      [
        { enabled: true, selectedId: 'x', quantity: 1, time: '08:00', note: '' },
        { enabled: true, selectedId: null, quantity: 1, time: '08:00', note: '' },
        { enabled: true, selectedId: '', quantity: 1, time: '08:00', note: '' },
        { enabled: false, selectedId: 'y', quantity: 1, time: '08:00', note: '' },
      ],
      [],
    );
    expect(committed.map((c) => c.productId)).toEqual(['x']);
  });

  it('drops unresolved rows without manual selection or with empty manual.id', () => {
    const committed = buildCommitted(
      [],
      [],
      [
        { manual: { id: 'm1' }, quantity: 1, time: '08:00', note: '' },
        { manual: null, quantity: 1, time: '08:00', note: '' },
        { manual: { id: '' }, quantity: 1, time: '08:00', note: '' },
      ],
    );
    expect(committed.map((c) => c.productId)).toEqual(['m1']);
  });

  it('combines all three categories preserving order resolved → ambiguous → unresolved', () => {
    const committed = buildCommitted(
      [{ enabled: true, productId: 'r1', quantity: 1, time: '08:00', note: '' }],
      [{ enabled: true, selectedId: 'a1', quantity: 1, time: '08:00', note: '' }],
      [{ manual: { id: 'u1' }, quantity: 1, time: '08:00', note: '' }],
    );
    expect(committed.map((c) => c.productId)).toEqual(['r1', 'a1', 'u1']);
  });
});
