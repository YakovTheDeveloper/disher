import type { Table } from 'dexie';
import { db } from './schema';
import { surfaceDexieError } from './dexieError';

// Wrap a write at the CONTRACT boundary (the outer await — never inside a
// db.transaction callback, which would abort the tx before rollback): classify
// storage failures (quota / open-failure) into a toaster, then re-throw so the
// tx still rolls back and safeMutate above still sees the reject. A silently
// dropped write is a tier-3 failure — the user believed their edit was saved.
async function withStorageGuard<T>(op: () => Promise<T>): Promise<T> {
  try {
    return await op();
  } catch (err) {
    surfaceDexieError(err);
    throw err;
  }
}

// ─── write contract ─────────────────────────────────────────────────────────
//
// The single sanctioned path for mutating Dexie. Every write stamps
// `updated_at` (the per-row LWW key merge() compares); every delete is hard AND
// records a `tombstones` row in the SAME rw-tx, so a converging device cannot
// resurrect a row this device deleted. Raw `db.<table>.put/add/update/delete/
// bulkDelete` is banned by lint everywhere except this file, the snapshot
// merge() (which writes incoming rows via `db.table.put` DIRECTLY to preserve
// their foreign `updated_at`), and the schema migration.
//
// merge() must NOT route through putRow: putRow re-stamps `now()` and would
// clobber the source timestamp LWW depends on.

// ─── monotonic high-water clock ──────────────────────────────────────────────
//
// `updated_at` is the LWW key merge() compares. A device's wall clock can be
// wrong (NTP correction, manual change) or simply behind a peer whose stamps we
// have already pulled — either case would let a genuinely-LATER edit receive a
// SMALLER stamp and lose silently on merge. So stamps don't come from the bare
// wall clock: every issued stamp is strictly greater than BOTH Date.now() AND
// the highest stamp this device has ever issued OR observed (the high-water
// mark). We never decide "the clock is wrong" — we only refuse to ever emit a
// stamp below something already known, which captures happened-after ordering
// (a Lamport-style clock) rather than absolute time.
//
// The mark is persisted in localStorage so it survives a reload — an offline
// edit made after a reload still can't go backwards relative to earlier offline
// edits. merge() feeds peer stamps in through observeStamp(): once we've seen t,
// our next write beats it. Residual gap (accepted, see arch review 2026-05-31):
// a clock running far AHEAD drags everyone forward and wins ties until real time
// catches up — there's no cheap guard without true clock sync.
const HWM_KEY = 'disher.clock.hwm';

function readHwm(): number {
  try {
    const n = Number(localStorage.getItem(HWM_KEY));
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0; // localStorage unavailable (non-browser sandbox) — fall back to wall clock
  }
}

function writeHwm(ms: number): void {
  try {
    localStorage.setItem(HWM_KEY, String(ms));
  } catch {
    /* no-op — fall back to wall clock */
  }
}

/** Raise the high-water mark to an already-existing stamp WITHOUT issuing a new
 *  one. merge() calls this for every incoming `updated_at` / `deleted_at` so a
 *  peer's higher clock pulls ours forward — our next write then beats it.
 *  Ignores absent/unparseable input (legacy rows, empty tombstone keys). */
export function observeStamp(iso: string | undefined): void {
  if (!iso) return;
  const ms = Date.parse(iso);
  if (Number.isFinite(ms) && ms > readHwm()) writeHwm(ms);
}

/** The next monotonic stamp: strictly greater than the wall clock AND every
 *  stamp issued or observed so far. The ISO millisecond format is unchanged, so
 *  merge()'s lexicographic string comparison still works. This is the single
 *  source of `updated_at` (and tombstone `deleted_at`). */
export function nextStamp(): string {
  const next = Math.max(Date.now(), readHwm() + 1);
  writeHwm(next);
  return new Date(next).toISOString();
}

const now = (): string => nextStamp();

/** Every domain row carries these three; the contract is generic over them. */
interface StampedRow {
  id: string;
  created_at: string;
  updated_at: string;
}

/** Structural view of a Dexie table — just enough to hard-delete by id and to
 *  name it for the tombstone + the transaction scope. Deliberately loose on
 *  the row type so heterogeneous tables can be batched in `deleteRows` without
 *  fighting Dexie's invariant `Table<T>`. */
interface DeletableTable {
  name: string;
  delete(key: string): PromiseLike<unknown>;
}

/** Insert or replace a full row, stamping `updated_at = now()`. The caller
 *  supplies every field except `updated_at`. */
export async function putRow<T extends StampedRow>(
  table: Table<T, string>,
  row: Omit<T, 'updated_at'>,
): Promise<void> {
  await withStorageGuard(() => table.put({ ...row, updated_at: now() } as T));
}

/** Insert or replace many full rows in one bulk op, stamping a shared
 *  `updated_at = now()` on each. */
export async function putRows<T extends StampedRow>(
  table: Table<T, string>,
  rows: Array<Omit<T, 'updated_at'>>,
): Promise<void> {
  if (rows.length === 0) return;
  const updatedAt = now();
  await withStorageGuard(() =>
    table.bulkPut(rows.map((row) => ({ ...row, updated_at: updatedAt }) as T)),
  );
}

/** Partially update a row, re-stamping `updated_at = now()`. Accepts either a
 *  typed partial (e.g. `{ name }`, `Partial<HypothesisRow>`) or a pre-mapped
 *  snake_case column patch (`Record<string, unknown>` built by an entity's
 *  COLUMN_MAP) — both shapes Dexie's `Table.update` takes; `updated_at` is
 *  always overwritten with now(). */
export async function updateRow<T extends StampedRow>(
  table: Table<T, string>,
  id: string,
  patch: Partial<T> | Record<string, unknown>,
): Promise<void> {
  await withStorageGuard(() => table.update(id, { ...patch, updated_at: now() } as never));
}

/** Hard-delete a row AND write its tombstone in one rw-tx. */
export async function deleteRow(table: DeletableTable, id: string): Promise<void> {
  // Guard the OUTER await: a quota/open failure inside the tx rejects the whole
  // transaction (Dexie rolls it back), we catch it here — after rollback — and
  // toast, then re-throw. Surfacing inside the callback would abort the tx.
  await withStorageGuard(() =>
    db.transaction('rw', [table.name, 'tombstones'], async () => {
      await table.delete(id);
      await db.tombstones.put({ id, table: table.name, deleted_at: now() });
    }),
  );
}

/** Hard-delete many rows (possibly across several tables) AND write all their
 *  tombstones in ONE rw-tx — the tx scope is every distinct table touched plus
 *  `tombstones`. A single shared `deleted_at` orders the whole batch. */
export async function deleteRows(
  pairs: Array<{ table: DeletableTable; id: string }>,
): Promise<void> {
  if (pairs.length === 0) return;
  const scope = [...new Set(pairs.map((p) => p.table.name)), 'tombstones'];
  const deletedAt = now();
  await withStorageGuard(() =>
    db.transaction('rw', scope, async () => {
      for (const { table, id } of pairs) {
        await table.delete(id);
        await db.tombstones.put({ id, table: table.name, deleted_at: deletedAt });
      }
    }),
  );
}
