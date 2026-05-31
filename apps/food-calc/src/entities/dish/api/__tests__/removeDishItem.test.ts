import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '@/shared/lib/dexie/schema';
import { addDishItem, removeDishItem } from '@/entities/dish';

// The dish-ingredient drawer deletes via removeDishItem. Same cross-device
// contract as schedule foods: a delete must tombstone or merge() resurrects it.
describe('removeDishItem — hard delete + tombstone', () => {
  it('removes the dish_item and writes a tombstone for it', async () => {
    const id = await addDishItem({ dishId: 'dish-1', productId: 'prod-1', quantity: 50 });

    expect(await db.dish_items.get(id)).toBeTruthy();

    await removeDishItem(id);

    expect(await db.dish_items.get(id)).toBeUndefined();

    const tomb = (await db.tombstones.toArray()).find(
      (t) => t.id === id && t.table === 'dish_items',
    );
    expect(tomb).toBeTruthy();
    expect(Number.isFinite(Date.parse(tomb!.deleted_at))).toBe(true);
  });
});
