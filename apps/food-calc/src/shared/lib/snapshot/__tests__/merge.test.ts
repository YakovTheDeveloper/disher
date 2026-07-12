import { describe, it, expect, beforeEach } from 'vitest';
import { db, type ProductRow, type InsightRow } from '@/shared/lib/dexie/schema';
import { merge, type Snapshot } from '@/shared/lib/snapshot';

// merge() reconciles an incoming vault blob into local Dexie. These cover the
// Tier-0 ingress guards against a LEGACY blob — one written before the
// merge-sync columns existed: rows carry created_at but no updated_at, and the
// blob has no `tombstones` key at all. merge() must not throw and must backfill
// the LWW key (updated_at) from created_at on ingest.

async function clearAll() {
  await Promise.all(db.tables.map((t) => t.clear()));
}

const ISO = '2026-01-01T00:00:00.000Z';

// A legacy product row: real domain fields + created_at, but NO updated_at.
function legacyProduct(
  id: string,
  name: string,
  created_at: string,
): Omit<ProductRow, 'updated_at'> {
  return {
    id,
    name,
    source: '',
    nutrients: {},
    portions: [],
    categories: [],
    serving_basis: '100g',
    serving_unit: null,
    description: '',
    created_at,
  };
}

// A modern product row carrying the LWW key.
function product(
  id: string,
  name: string,
  updated_at: string,
  created_at = ISO,
): ProductRow {
  return { ...legacyProduct(id, name, created_at), updated_at };
}

describe('merge() — legacy vault blob ingress', () => {
  beforeEach(clearAll);

  it('does not throw on a legacy blob (no updated_at, no tombstones key) and backfills updated_at from created_at', async () => {
    const incoming: Snapshot = {
      products: [legacyProduct('p1', 'Apple', ISO)],
      // legacy: no `tombstones` key; other domain tables absent entirely
    };

    await expect(merge(incoming)).resolves.toBeUndefined();

    const row = await db.products.get('p1');
    expect(row).toBeTruthy();
    expect(row?.updated_at).toBe(ISO); // backfilled from created_at
  });

  it('tolerates a completely empty incoming object', async () => {
    await expect(merge({})).resolves.toBeUndefined();
  });

  it('adopts a legacy row even when local already holds a stamped row (legacy created_at < local updated_at keeps local)', async () => {
    await db.products.put({ ...legacyProduct('p1', 'Local', ISO), updated_at: '2026-06-01T00:00:00.000Z' });

    // Incoming legacy row for the same id, older created_at → local must win.
    await merge({ products: [legacyProduct('p1', 'Stale', '2025-01-01T00:00:00.000Z')] });

    const row = await db.products.get('p1');
    expect(row?.name).toBe('Local');
    expect(row?.updated_at).toBe('2026-06-01T00:00:00.000Z');
  });
});

describe('merge() — LWW, tombstones, idempotency, adoption', () => {
  beforeEach(clearAll);

  it('LWW: a newer incoming row overwrites the local one; an older one is ignored', async () => {
    await db.products.put(product('p1', 'Local-v1', '2026-02-01T00:00:00.000Z'));
    await db.products.put(product('p2', 'Local-v1', '2026-02-01T00:00:00.000Z'));

    await merge({
      products: [
        product('p1', 'Incoming-newer', '2026-03-01T00:00:00.000Z'), // newer → wins
        product('p2', 'Incoming-older', '2026-01-01T00:00:00.000Z'), // older → loses
      ],
      tombstones: [],
    });

    expect((await db.products.get('p1'))?.name).toBe('Incoming-newer');
    expect((await db.products.get('p2'))?.name).toBe('Local-v1');
  });

  it('empty-merge adoption: a fresh local DB adopts every incoming row', async () => {
    await merge({
      products: [
        product('p1', 'A', '2026-01-01T00:00:00.000Z'),
        product('p2', 'B', '2026-01-01T00:00:00.000Z'),
      ],
      tombstones: [],
    });

    expect(await db.products.count()).toBe(2);
  });

  it('tombstone delete-after-edit: a tombstone newer than the local row removes it', async () => {
    await db.products.put(product('p1', 'Edited', '2026-02-01T00:00:00.000Z'));

    await merge({
      tombstones: [{ id: 'p1', table: 'products', deleted_at: '2026-03-01T00:00:00.000Z' }],
    });

    expect(await db.products.get('p1')).toBeUndefined();
  });

  it('tombstone edit-after-delete revives: an incoming row newer than the tombstone survives', async () => {
    // Local remembers a delete at t1.
    await db.tombstones.put({ id: 'p1', table: 'products', deleted_at: '2026-02-01T00:00:00.000Z' });

    // A peer re-created/edited p1 at t2 > t1 → the edit revives it.
    await merge({
      products: [product('p1', 'Reborn', '2026-03-01T00:00:00.000Z')],
      tombstones: [],
    });

    expect((await db.products.get('p1'))?.name).toBe('Reborn');
  });

  it('idempotent: merging the same blob twice yields the same state', async () => {
    const blob: Snapshot = {
      products: [product('p1', 'A', '2026-03-01T00:00:00.000Z')],
      tombstones: [{ id: 'p2', table: 'products', deleted_at: '2026-03-01T00:00:00.000Z' }],
    };
    await db.products.put(product('p2', 'WillDie', '2026-01-01T00:00:00.000Z'));

    await merge(blob);
    const after1 = await db.products.toArray();
    await merge(blob);
    const after2 = await db.products.toArray();

    expect(after2).toEqual(after1);
    expect(after1.map((r) => r.id)).toEqual(['p1']); // p2 tombstoned, p1 adopted
  });
});

// `insights` joined DOMAIN_TABLES in schema v8. The merge is table-agnostic, but
// the whole point of adding a domain table is that an OLD vault blob (written
// before the table existed, so it has no `insights` key) must NOT wipe a
// locally-saved insight — and a blob carrying insights must LWW-merge like any
// other table. This pins both directly rather than transitively via products.
function insightRow(
  id: string,
  title: string,
  updated_at: string,
  created_at = ISO,
): InsightRow {
  return {
    id,
    title,
    detail: 'd',
    valence: 'neutral',
    strength: 'weak',
    evidence: { days: ['01-01-2026'] },
    source: 'daily',
    created_at,
    updated_at,
  };
}

describe('merge() — insights table (DOMAIN_TABLES, v8)', () => {
  beforeEach(clearAll);

  it('an OLD blob without an `insights` key never drops a locally-saved insight', async () => {
    await db.insights.put(insightRow('i1', 'iron+C', '2026-06-01T00:00:00.000Z'));
    // Legacy-shaped blob: only products, no `insights` key at all.
    await merge({ products: [legacyProduct('p1', 'Apple', ISO)] });
    expect((await db.insights.get('i1'))?.title).toBe('iron+C');
  });

  it('adopts incoming insights and applies LWW by updated_at', async () => {
    await db.insights.put(insightRow('i1', 'Local', '2026-02-01T00:00:00.000Z'));
    await merge({
      insights: [
        insightRow('i1', 'Incoming-newer', '2026-03-01T00:00:00.000Z'), // newer → wins
        insightRow('i2', 'Fresh', '2026-01-01T00:00:00.000Z'), // new id → adopted
      ],
      tombstones: [],
    });
    expect((await db.insights.get('i1'))?.title).toBe('Incoming-newer');
    expect((await db.insights.get('i2'))?.title).toBe('Fresh');
  });

  it('a tombstone newer than a local insight removes it', async () => {
    await db.insights.put(insightRow('i1', 'doomed', '2026-02-01T00:00:00.000Z'));
    await merge({
      tombstones: [{ id: 'i1', table: 'insights', deleted_at: '2026-03-01T00:00:00.000Z' }],
    });
    expect(await db.insights.get('i1')).toBeUndefined();
  });
});
