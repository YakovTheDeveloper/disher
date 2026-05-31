import type { Table } from 'dexie';
import { db, type TombstoneRow } from '@/shared/lib/dexie/schema';
import { observeStamp } from '@/shared/lib/dexie/write';
import { authedFetch } from '@/shared/lib/api/authedFetch';
import { API_BASE } from '@/shared/lib/api/base';

// Snapshot vault transports + reconciliation.
//
// Three local ops:
//   • dump()  — read every table into a plain blob (push payload / file export)
//   • apply() — REPLACE every table from a blob (file-restore; stamps a missing
//               updated_at from created_at so pre-merge exports gain the LWW key)
//   • merge() — per-row LWW union by updated_at + tombstone-apply, in one rw-tx;
//               incoming rows are written via db.table.put DIRECTLY so their
//               foreign updated_at is preserved (never re-stamped to now())
// and two HTTP transports (push/pull) over PUT/GET /api/backup.
//
// See apps/food-calc/tds/ANALYSIS/zero-base-rewrite-2026-05-09.md §User route
// and the merge-sync fix plan (.claude/ralph/fix_plan.md).

const URL = `${API_BASE}/api/backup`;

export type Snapshot = Record<string, unknown[]>;

// The nine user-owned domain tables merge() reconciles (tombstones ride their
// own track; `periods` was dropped in schema v7). Single source of truth for
// "which tables hold user rows that LWW-merge".
export const DOMAIN_TABLES = [
  'products',
  'dishes',
  'dish_items',
  'dish_portions',
  'schedule_foods',
  'schedule_events',
  'daily_norms',
  'hypotheses',
  'custom_tags',
] as const;

// Minimal row lens merge() needs: the id and the LWW key. updated_at/created_at
// are optional because a legacy vault blob predates the updated_at column — the
// ingest guard in merge() backfills updated_at from created_at.
type MergeRow = { id: string; created_at?: string; updated_at?: string };

export async function dump(): Promise<Snapshot> {
  const out: Snapshot = {};
  await Promise.all(
    db.tables.map(async (t) => {
      out[t.name] = await t.toArray();
    }),
  );
  return out;
}

// Give an imported row the LWW key if it predates updated_at: updated_at falls
// back to created_at. Rows without created_at (e.g. tombstones) pass through.
function stampImportRow(row: unknown): unknown {
  if (row && typeof row === 'object') {
    const r = row as Record<string, unknown>;
    if (r.updated_at === undefined && typeof r.created_at === 'string') {
      return { ...r, updated_at: r.created_at };
    }
  }
  return row;
}

export async function apply(s: Snapshot): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
    for (const t of db.tables) {
      const rows = s[t.name];
      if (Array.isArray(rows) && rows.length) {
        await t.bulkPut(rows.map(stampImportRow) as never);
      }
    }
  });
}

// Reconcile an incoming snapshot into local Dexie. Convergent: per row the
// higher updated_at wins (union keeps a row present on only one side); a
// tombstone whose deleted_at is >= the surviving row's updated_at removes it
// (so delete-after-edit deletes, edit-after-delete revives). Incoming rows are
// written with db.table.put DIRECTLY to preserve their source updated_at —
// putRow would re-stamp now() and corrupt LWW. All in one rw-tx.
export async function merge(incoming: Snapshot): Promise<void> {
  await db.transaction('rw', [...DOMAIN_TABLES, 'tombstones'], async () => {
    // 1. Tombstones: LWW by deleted_at (keyed by the deleted row's id), and
    //    persist the winners locally so this device can re-propagate them.
    const incomingTombstones = (incoming.tombstones ?? []) as TombstoneRow[];
    const tombById = new Map<string, TombstoneRow>();
    for (const t of await db.tombstones.toArray()) tombById.set(t.id, t);
    for (const t of incomingTombstones) {
      observeStamp(t.deleted_at); // pull our clock up to a peer's delete stamp
      const cur = tombById.get(t.id);
      if (!cur || t.deleted_at > cur.deleted_at) {
        tombById.set(t.id, t);
        await db.tombstones.put(t);
      }
    }

    // 2. Per domain table: LWW union, then drop any row a tombstone outlives.
    for (const name of DOMAIN_TABLES) {
      const tbl = db.table(name) as unknown as Table<MergeRow, string>;
      const incomingRows = (incoming[name] ?? []) as MergeRow[];
      const byId = new Map<string, MergeRow>(
        (await tbl.toArray()).map((r): [string, MergeRow] => [r.id, r]),
      );
      for (const inc of incomingRows) {
        // Legacy vault rows have created_at but no updated_at — backfill the
        // LWW key from created_at on ingest so the comparison below is sound.
        inc.updated_at ??= inc.created_at;
        observeStamp(inc.updated_at); // pull our clock up to a peer's edit stamp
        const local = byId.get(inc.id);
        if (!local || (inc.updated_at ?? '') > (local.updated_at ?? '')) {
          await tbl.put(inc);
          byId.set(inc.id, inc);
        }
      }
      for (const [id, row] of byId) {
        const tomb = tombById.get(id);
        if (tomb && tomb.table === name && (row.updated_at ?? '') <= tomb.deleted_at) {
          await tbl.delete(id);
        }
      }
    }
  });
}

// Tombstones are kept only long enough to outlive the longest plausible gap
// between a delete on one device and a pull on another. Past that horizon a
// stale tombstone can no longer suppress a live row anywhere — it's dead weight
// riding in every blob. 90 days is far beyond any real offline window for a
// ≤30-day-horizon app; a device dormant longer simply re-adopts the row as new.
// INVARIANT: the TTL MUST exceed the max device-offline window, otherwise a
// long-dormant device that still holds the (locally live) row resurrects it
// after its tombstone was pruned everywhere. Don't lower this without raising
// that bound.
const TOMBSTONE_TTL_MS = 90 * 24 * 60 * 60 * 1000;

// Drop tombstones older than the retention horizon. Runs inside syncNow() after
// merge() and before push() so pruned tombstones also leave the pushed blob.
// Coarse horizon — uses the bare wall clock, not the monotonic stamp.
// `deleted_at` is NOT indexed (the store is keyed by `id, table`), so this is a
// full-table filter+delete, not a `.where()` range — the tombstones table is
// small enough that scanning it is cheaper than carrying an extra index.
export async function pruneTombstones(): Promise<void> {
  const cutoff = new Date(Date.now() - TOMBSTONE_TTL_MS).toISOString();
  await db.tombstones.filter((t) => t.deleted_at < cutoff).delete();
}

export async function push(): Promise<void> {
  const body = JSON.stringify(await dump());
  const r = await authedFetch(URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  if (!r.ok) throw new Error(`push failed: ${r.status}`);
}

export async function pull(): Promise<Snapshot | null> {
  const r = await authedFetch(URL);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`pull failed: ${r.status}`);
  return (await r.json()) as Snapshot;
}

// One serialized round-trip: pull the vault, merge it into local Dexie (LWW +
// tombstones), prune expired tombstones, then push the reconciled local state
// back. Held under the
// 'disher-sync' Web Lock so the mount auto-sync and any manual sync button
// can't interleave and tear each other's dump/push — and a bare push can't
// clobber unpulled remote changes (the backend blob is whole-snapshot LWW).
// Runs lock-less where the Web Locks API is unavailable (older engines, tests).
export async function syncNow(): Promise<void> {
  const run = async () => {
    const incoming = await pull();
    if (incoming) await merge(incoming);
    await pruneTombstones(); // GC expired tombstones before they ride the blob up
    await push();
  };
  if (typeof navigator !== 'undefined' && navigator.locks) {
    await navigator.locks.request('disher-sync', run);
  } else {
    await run();
  }
}
