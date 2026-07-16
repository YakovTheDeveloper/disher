import { db } from '@/shared/lib/dexie/schema';
import { merge, dump, type Snapshot } from '@/shared/lib/snapshot';

// Test harness for merge(). Everything here exists to make merge() runnable as a
// PURE function of (local, incoming) despite it being a stateful Dexie rw-tx.
//
// Three mines this file defuses — each cost real debugging time, don't remove:
//
//  1. merge() MUTATES its argument (`inc.updated_at ??= inc.created_at`,
//     snapshot/index.ts:113). A fixture reused across two merges would be
//     silently rewritten by the first one. Every merge here gets a
//     structuredClone.
//  2. apply() BACKFILLS legacy stamps (`updated_at ??= created_at`). Seeding the
//     local side through apply() would therefore make it impossible to test what
//     merge() does to an unstamped LOCAL row. seedLocal() writes raw instead.
//  3. fast-check runs N samples inside ONE `it`, so `beforeEach` fires once, not
//     per sample. Every property must call resetWorld() itself, FIRST THING in
//     the sample.

const HWM_KEY = 'disher.clock.hwm';

/** Wipe Dexie AND the monotonic clock. Both are process-global singletons, so a
 *  leaked high-water mark from a previous sample would shift every stamp the
 *  next one issues. */
export async function resetWorld(): Promise<void> {
  await Promise.all(db.tables.map((t) => t.clear()));
  localStorage.removeItem(HWM_KEY);
}

export function readHwm(): number {
  return Number(localStorage.getItem(HWM_KEY)) || 0;
}

export function writeHwm(ms: number): void {
  localStorage.setItem(HWM_KEY, String(ms));
}

/** Seed the LOCAL side of a merge. Deliberately a raw bulkPut, NOT apply():
 *  apply() would stamp `updated_at` from `created_at`, so an intentionally
 *  legacy (unstamped) local row could never be expressed. Raw writes are
 *  lint-exempt under __tests__/. */
export async function seedLocal(snap: Snapshot): Promise<void> {
  for (const [name, rows] of Object.entries(snap)) {
    if (Array.isArray(rows) && rows.length > 0) {
      await db.table(name).bulkPut(rows as never);
    }
  }
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    const src = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(src).sort()) out[k] = sortKeys(src[k]);
    return out;
  }
  return value;
}

/** Canonical form of a snapshot: empty tables dropped, tables and object keys
 *  sorted, rows ordered by id. Two snapshots are semantically equal iff their
 *  canon() forms are deep-equal — merge() gives no ordering guarantee, and
 *  dump() emits every table including the empty ones. */
export function canon(snap: Snapshot): Snapshot {
  const out: Snapshot = {};
  for (const name of Object.keys(snap).sort()) {
    const rows = snap[name];
    if (!Array.isArray(rows) || rows.length === 0) continue;
    out[name] = [...rows]
      .sort((a, b) =>
        String((a as { id?: string }).id ?? '').localeCompare(
          String((b as { id?: string }).id ?? ''),
        ),
      )
      .map(sortKeys);
  }
  return out;
}

/** merge() as a pure function: local ⊕ incoming → resulting snapshot. */
export async function mergedState(
  local: Snapshot,
  incoming: Snapshot,
): Promise<Snapshot> {
  return mergeSeq(local, incoming);
}

/** Fold a sequence of incoming blobs into a local starting state. Order is the
 *  point — this is what commutativity and associativity are asserted over. */
export async function mergeSeq(
  local: Snapshot,
  ...incomings: Snapshot[]
): Promise<Snapshot> {
  await resetWorld();
  await seedLocal(local);
  for (const inc of incomings) {
    await merge(structuredClone(inc));
  }
  return canon(await dump());
}
