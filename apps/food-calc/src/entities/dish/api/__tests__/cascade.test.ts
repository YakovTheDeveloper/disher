import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/shared/lib/dexie/schema';
import { merge, type Snapshot } from '@/shared/lib/snapshot';
import { createDish, addDishItem, addDishPortion, deleteDish } from '../mutations';

// The dish delete cascade must enumerate its OWN children (by dish_id, not from
// caller-passed arrays) and hard-delete + tombstone each, so no dish_items /
// dish_portions are left orphaned — locally or after a peer's deletion
// converges in. Regression guard for the empty-arrays caller bug.

async function clearAll() {
  await Promise.all(db.tables.map((t) => t.clear()));
}

describe('dish delete cascade', () => {
  beforeEach(clearAll);

  it('deletes the dish AND every child, leaving no orphans, and tombstones each row', async () => {
    const dishId = await createDish('Борщ');
    const i1 = await addDishItem({ dishId, productId: 'p1', quantity: 100 });
    const i2 = await addDishItem({ dishId, productId: 'p2', quantity: 50 });
    await addDishPortion(dishId, { label: 'тарелка', grams: 300 });

    expect(await db.dish_items.where('dish_id').equals(dishId).count()).toBe(2);
    expect(await db.dish_portions.where('dish_id').equals(dishId).count()).toBe(1);

    await deleteDish(dishId);

    expect(await db.dishes.get(dishId)).toBeUndefined();
    expect(await db.dish_items.where('dish_id').equals(dishId).count()).toBe(0);
    expect(await db.dish_portions.where('dish_id').equals(dishId).count()).toBe(0);

    // A tombstone per removed row: the dish, both items, the portion.
    const tombs = await db.tombstones.toArray();
    expect(tombs.filter((t) => t.table === 'dishes').map((t) => t.id)).toEqual([dishId]);
    expect(
      tombs.filter((t) => t.table === 'dish_items').map((t) => t.id).sort(),
    ).toEqual([i1, i2].sort());
    expect(tombs.filter((t) => t.table === 'dish_portions')).toHaveLength(1);
  });

  it('converges: a peer that deleted the dish removes our copy + children, no orphans survive', async () => {
    // Local device still holds the dish + children.
    const dishId = await createDish('Борщ');
    await addDishItem({ dishId, productId: 'p1', quantity: 100 });
    await addDishPortion(dishId, { label: 'тарелка', grams: 300 });

    const itemIds = await db.dish_items.where('dish_id').equals(dishId).primaryKeys();
    const portionIds = await db.dish_portions.where('dish_id').equals(dishId).primaryKeys();

    // Peer snapshot: it deleted everything → empty domain tables, only
    // tombstones, all dated far in the future so they outlive our now()-rows.
    const deletedAt = '2999-01-01T00:00:00.000Z';
    const peer: Snapshot = {
      tombstones: [
        { id: dishId, table: 'dishes', deleted_at: deletedAt },
        ...itemIds.map((id) => ({ id, table: 'dish_items', deleted_at: deletedAt })),
        ...portionIds.map((id) => ({ id, table: 'dish_portions', deleted_at: deletedAt })),
      ],
    };

    await merge(peer);

    expect(await db.dishes.get(dishId)).toBeUndefined();
    expect(await db.dish_items.where('dish_id').equals(dishId).count()).toBe(0);
    expect(await db.dish_portions.where('dish_id').equals(dishId).count()).toBe(0);
  });
});
