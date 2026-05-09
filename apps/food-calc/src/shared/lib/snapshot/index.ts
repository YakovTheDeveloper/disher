import { db } from '@/shared/lib/dexie/schema';
import { authedFetch } from '@/shared/lib/api/authedFetch';
import { API_BASE } from '@/shared/lib/api/base';

// Snapshot vault — one writer, no merge. dump/apply are local; push/pull are
// HTTP transports over PUT/GET /api/backup. Last write wins on the server.
//
// See apps/food-calc/tds/ANALYSIS/zero-base-rewrite-2026-05-09.md §User route.

const URL = `${API_BASE}/api/backup`;

export type Snapshot = Record<string, unknown[]>;

export async function dump(): Promise<Snapshot> {
  const out: Snapshot = {};
  await Promise.all(
    db.tables.map(async (t) => {
      out[t.name] = await t.toArray();
    }),
  );
  return out;
}

export async function apply(s: Snapshot): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
    for (const t of db.tables) {
      const rows = s[t.name];
      if (Array.isArray(rows) && rows.length) await t.bulkPut(rows as never);
    }
  });
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
