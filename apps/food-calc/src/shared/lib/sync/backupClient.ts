import { db, SYNCED_TABLES, type SyncedTable } from '@/shared/lib/dexie/schema';
import { API_BASE } from '@/shared/lib/api/base';
import { authedFetch } from '@/shared/lib/api/authedFetch';
import { pickIdsSafeToClean } from './timestampGuard';

// Push protocol with the backup endpoint — single source for `/api/backup/*`.
// Conflict resolution lives on the server (LWW on edit_count, tie-break
// client_modified_at, soft-delete sticky); this module just batches dirty
// rows, calls the endpoint, applies the timestamp guard on success, and
// surfaces server-state on rejection.

const PUSH_URL     = `${API_BASE}/api/backup`;
const SNAPSHOT_URL = `${API_BASE}/api/backup/snapshot`;
const STATS_URL    = `${API_BASE}/api/backup/stats`;

// Per-table chunk cap — Notesnook splits per-collection so the server gets
// homogeneous batches and 413 split-and-retry is straightforward.
const CHUNK_SIZE = 500;

type AcceptedRow = {
  table: SyncedTable;
  id: string;
  server_edit_count: number;
  server_received_at: string;
};

type RejectedRow = {
  table: SyncedTable;
  id: string;
  reason: 'stale_edit_count' | 'user_id_mismatch';
  server_state?: {
    id: string;
    edit_count: number;
    client_modified_at: string;
    deleted_at: string | null;
  };
};

// Strip Dexie-only fields before sending to the server.
function toWireRow<T extends Record<string, unknown>>(table: SyncedTable, row: T) {
  const { _dirty, server_received_at, ...rest } = row;
  void _dirty;
  void server_received_at;
  return { table, ...rest };
}

export async function drainPush(userId: string): Promise<{
  accepted: number;
  rejected: number;
}> {
  // 1. Capture pushTimestamp BEFORE reading dirty rows. Anything mutated AFTER
  // this timestamp must keep its _dirty flag even if we later ACK the row —
  // that's the Notesnook timestamp-guard pattern preventing in-flight edits
  // from being silently marked clean.
  const pushTimestamp = new Date().toISOString();

  let acceptedTotal = 0;
  let rejectedTotal = 0;

  for (const table of SYNCED_TABLES) {
    const dirty = await db[table]
      .where('[user_id+_dirty]')
      .equals([userId, 1] as never)
      .toArray();

    if (dirty.length === 0) continue;

    for (let i = 0; i < dirty.length; i += CHUNK_SIZE) {
      const chunk = dirty.slice(i, i + CHUNK_SIZE);
      const rows = chunk.map((r) => toWireRow(table, r as unknown as Record<string, unknown>));

      const res = await authedFetch(PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });

      if (res.status === 401) {
        // Session may have expired between token read and fetch — let the
        // caller retry after auto-refresh.
        throw new Error('Backup push unauthenticated (401) — will retry');
      }
      if (!res.ok) {
        throw new Error(`Backup push failed: ${res.status} ${res.statusText}`);
      }

      const body = (await res.json()) as {
        accepted: AcceptedRow[];
        rejected: RejectedRow[];
      };

      // 2. Clear _dirty on accepted rows, BUT only if their client_modified_at
      // is <= pushTimestamp. If the user mutated again while we were in
      // flight, edit_count/client_modified_at moved past pushTimestamp and
      // we must keep _dirty=1 so the next drain catches the new edit.
      const acceptedIds = new Set(body.accepted.map((a) => a.id));
      if (acceptedIds.size > 0) {
        await db.transaction('rw', db[table], async () => {
          const persisted = await db[table]
            .where('id')
            .anyOf([...acceptedIds])
            .toArray();
          const candidates = persisted.map((r) => {
            const o = r as unknown as Record<string, unknown>;
            return {
              id: o.id as string,
              client_modified_at: o.client_modified_at as string,
            };
          });
          const safeIds = new Set(pickIdsSafeToClean(candidates, pushTimestamp));
          for (const id of safeIds) {
            const ack = body.accepted.find((a) => a.id === id);
            await db[table].update(id, {
              __server_apply: true,
              _dirty: 0,
              server_received_at: ack?.server_received_at,
            } as never);
          }
        });
      }

      acceptedTotal += body.accepted.length;
      rejectedTotal += body.rejected.length;
    }
  }

  return { accepted: acceptedTotal, rejected: rejectedTotal };
}

// ─── snapshot pull (recovery / fresh install) ──────────────────────────────

type SnapshotPayload = Partial<Record<SyncedTable, Array<Record<string, unknown>>>>;

export async function pullSnapshot(): Promise<{ rows: number }> {
  const res = await authedFetch(SNAPSHOT_URL);
  if (!res.ok) {
    throw new Error(`Snapshot pull failed: ${res.status} ${res.statusText}`);
  }
  const payload = (await res.json()) as SnapshotPayload;

  let totalRows = 0;
  for (const table of SYNCED_TABLES) {
    const rows = payload[table] ?? [];
    if (rows.length === 0) continue;
    const stamped = rows.map((r) => ({
      ...r,
      __server_apply: true,
      _dirty: 0,
    }));
    // db[table] is a Dexie Table union; cast to a concrete Table to make
    // bulkPut callable. The runtime row shape matches because we already
    // re-tagged each row with __server_apply + _dirty=0 above.
    const concrete = db[table] as unknown as { bulkPut: (rows: unknown[]) => Promise<unknown> };
    await concrete.bulkPut(stamped);
    totalRows += rows.length;
  }
  return { rows: totalRows };
}

// ─── stats (reset-and-resync fail-safe) ────────────────────────────────────

export async function fetchBackupStats(): Promise<Record<SyncedTable, number>> {
  const res = await authedFetch(STATS_URL);
  if (!res.ok) {
    throw new Error(`Backup stats failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as Record<SyncedTable, number>;
}
