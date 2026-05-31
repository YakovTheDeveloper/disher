import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/shared/lib/dexie/schema';
import { pruneTombstones } from '@/shared/lib/snapshot';

// pruneTombstones() GCs tombstones older than the 90-day retention horizon so
// they stop riding in every pushed blob. The horizon must outlive the longest
// device-offline window — these tests pin the boundary behaviour, not the exact
// number of days.

async function clearAll() {
  await Promise.all(db.tables.map((t) => t.clear()));
}

const daysAgo = (n: number): string =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

describe('pruneTombstones()', () => {
  beforeEach(clearAll);

  it('drops tombstones past the retention horizon and keeps recent ones', async () => {
    await db.tombstones.bulkPut([
      { id: 'old', table: 'products', deleted_at: daysAgo(120) }, // > 90d → pruned
      { id: 'edge', table: 'products', deleted_at: daysAgo(89) }, // < 90d → kept
      { id: 'fresh', table: 'products', deleted_at: daysAgo(1) }, // kept
    ]);

    await pruneTombstones();

    const ids = (await db.tombstones.toArray()).map((t) => t.id).sort();
    expect(ids).toEqual(['edge', 'fresh']);
  });

  it('is a no-op when nothing has expired', async () => {
    await db.tombstones.bulkPut([
      { id: 'a', table: 'products', deleted_at: daysAgo(10) },
      { id: 'b', table: 'dishes', deleted_at: daysAgo(30) },
    ]);

    await pruneTombstones();

    expect(await db.tombstones.count()).toBe(2);
  });

  it('tolerates an empty tombstones table', async () => {
    await expect(pruneTombstones()).resolves.toBeUndefined();
  });
});
