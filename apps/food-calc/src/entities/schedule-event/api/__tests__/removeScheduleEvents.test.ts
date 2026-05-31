import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '@/shared/lib/dexie/schema';
import { addScheduleEvent, removeScheduleEvents } from '@/entities/schedule-event';

// The event drawer deletes via removeScheduleEvents([id]). Same cross-device
// contract: a delete must tombstone or merge() resurrects it on another device.
describe('removeScheduleEvents — hard delete + tombstone', () => {
  it('removes the event and writes a tombstone for it', async () => {
    const id = await addScheduleEvent({ date: '01-06-2026', time: '09:00', text: 'walk' });

    expect(await db.schedule_events.get(id)).toBeTruthy();

    await removeScheduleEvents([id]);

    expect(await db.schedule_events.get(id)).toBeUndefined();

    const tomb = (await db.tombstones.toArray()).find(
      (t) => t.id === id && t.table === 'schedule_events',
    );
    expect(tomb).toBeTruthy();
    expect(Number.isFinite(Date.parse(tomb!.deleted_at))).toBe(true);
  });
});
