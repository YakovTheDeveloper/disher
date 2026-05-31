import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '@/shared/lib/dexie/schema';
import { addScheduleFood, removeScheduleFood } from '@/entities/schedule-food';

// The per-item drawer deletes via removeScheduleFood. In the backup-only arch a
// delete MUST leave a tombstone, otherwise merge() on another device resurrects
// the row. This guards that cross-device contract end-to-end.
describe('removeScheduleFood — hard delete + tombstone', () => {
  it('removes the row and writes a tombstone for it', async () => {
    const id = await addScheduleFood({
      date: '01-06-2026',
      time: '08:00',
      type: 'food',
      quantity: 100,
      productId: 'prod-x',
    });

    expect(await db.schedule_foods.get(id)).toBeTruthy();

    await removeScheduleFood(id);

    expect(await db.schedule_foods.get(id)).toBeUndefined();

    const tombstones = await db.tombstones.toArray();
    const tomb = tombstones.find((t) => t.id === id && t.table === 'schedule_foods');
    expect(tomb).toBeTruthy();
    expect(tomb?.deleted_at).toBeTruthy();
  });
});
