import fc from 'fast-check';
import type {
  ProductRow,
  InsightRow,
  CustomTagRow,
  TombstoneRow,
} from '@/shared/lib/dexie/schema';
import type { Snapshot } from '@/shared/lib/snapshot';

// Generators for merge() property tests.
//
// Three representative domain tables, chosen for what they exercise rather than
// for coverage: `products` (the fat row, carries the non-indexed `description`
// that И-6 is about), `insights` (joined DOMAIN_TABLES late, in schema v8 — the
// И-5 schema-lag table), `custom_tags` (the thin row with a natural key that LWW
// cannot enforce — И-12).
//
// The id pool is deliberately TINY (4 ids over 3 tables). Merge conflicts are
// the entire subject; a wide id space would generate disjoint snapshots that
// merge trivially and prove nothing.

// Ids are namespaced per table, and that is NOT cosmetic. Production ids are
// crypto.randomUUID(), so a row id is unique across the WHOLE database, never
// merely within its table — and merge() leans on that: `tombById` is keyed by
// the bare id (snapshot/index.ts:92), so two tombstones sharing an id fight over
// one slot and the loser's delete is silently dropped. A generator that drew ids
// from one pool shared across tables would manufacture that collision and break
// commutativity/associativity on states production cannot reach. (It did, on the
// first run — the reproducer now lives in merge.props.test.ts under И-11.)
const IDS_BY_TABLE = {
  products: ['p1', 'p2', 'p3', 'p4'],
  insights: ['i1', 'i2', 'i3', 'i4'],
  custom_tags: ['c1', 'c2', 'c3', 'c4'],
} as const;

/** Distinct stamps, one per minute. Sampling two rows from this pool almost
 *  never ties — the "healthy fleet" regime where merge is supposed to converge. */
export const WIDE_STAMPS: readonly string[] = Array.from({ length: 12 }, (_, i) =>
  new Date(Date.UTC(2026, 2, 1, 10, i)).toISOString(),
);

/** Three stamps only — collisions are the norm. The degenerate regime И-2
 *  describes: once the HWM counter outruns the wall clock, peers emit identical
 *  stamps for different content. */
export const TIE_STAMPS: readonly string[] = WIDE_STAMPS.slice(0, 3);

/** What a Kotlin `Instant.toString()` emits when the millisecond field is zero.
 *  Lexicographically SMALLER than any stamp in the same second that carries
 *  millis — see И-4. JS never produces this shape; a second writer will. */
export const NO_MILLIS_STAMP = '2026-03-01T10:05:00Z';
export const SAME_SECOND_WITH_MILLIS = '2026-03-01T10:05:00.001Z';

export function productRow(
  id: string,
  content: string,
  updated_at: string | undefined,
  created_at = '2026-01-01T00:00:00.000Z',
): ProductRow {
  const row: ProductRow = {
    id,
    name: content,
    source: '',
    nutrients: {},
    portions: [],
    categories: [],
    serving_basis: '100g',
    serving_unit: null,
    description: '',
    created_at,
    updated_at: updated_at as string,
  };
  // A LEGACY row (pre-merge-sync vault) genuinely has no updated_at key at all —
  // `undefined` is not the same thing, and merge()'s `??=` guard distinguishes them.
  if (updated_at === undefined) delete (row as Partial<ProductRow>).updated_at;
  return row;
}

export function insightRow(
  id: string,
  content: string,
  updated_at: string,
  created_at = '2026-01-01T00:00:00.000Z',
): InsightRow {
  return {
    id,
    title: content,
    detail: 'd',
    valence: 'neutral',
    strength: 'weak',
    evidence: { days: ['01-01-2026'] },
    source: 'daily',
    created_at,
    updated_at,
  };
}

export function customTagRow(
  id: string,
  content: string,
  updated_at: string,
  created_at = '2026-01-01T00:00:00.000Z',
): CustomTagRow {
  return { id, product_id: 'prod-1', tag: content, created_at, updated_at };
}

const BUILDERS = {
  products: productRow,
  insights: insightRow as (
    id: string,
    c: string,
    u: string | undefined,
    cr?: string,
  ) => InsightRow,
  custom_tags: customTagRow as (
    id: string,
    c: string,
    u: string | undefined,
    cr?: string,
  ) => CustomTagRow,
} as const;

export type TableName = keyof typeof BUILDERS;
export const TABLES = Object.keys(BUILDERS) as TableName[];

/** The LWW-relevant projection of a row: which row it is, and what merge()
 *  compares. Two rows with the same (table, id, stamp) but different content are
 *  exactly the conflicting-tie shape И-2 is about. */
export interface RowSpec {
  table: TableName;
  id: string;
  content: string;
  stamp: string | undefined;
}

function arbRowSpec(stamps: readonly string[], legacy: boolean) {
  const arbStamp = legacy
    ? fc.oneof(
        fc.constantFrom(...stamps),
        // `products` tolerates a missing stamp (legacy blob); the others don't
        // model it, so specs that draw `undefined` for them are dropped below.
        fc.constant(undefined),
      )
    : fc.constantFrom(...stamps);
  return fc
    .constantFrom(...TABLES)
    .chain((table) =>
      fc.record({
        table: fc.constant(table),
        id: fc.constantFrom(...IDS_BY_TABLE[table]),
        content: fc.constantFrom('A', 'B', 'C'),
        stamp: arbStamp,
      }),
    );
}

function specsToSnapshot(specs: RowSpec[], tombstones: TombstoneRow[]): Snapshot {
  const out: Snapshot = {};
  // Last spec wins per (table, id) — a snapshot cannot hold the same id twice.
  const byKey = new Map<string, RowSpec>();
  for (const s of specs) {
    if (s.stamp === undefined && s.table !== 'products') continue;
    byKey.set(`${s.table}/${s.id}`, s);
  }
  for (const spec of byKey.values()) {
    (out[spec.table] ??= []).push(
      BUILDERS[spec.table](spec.id, spec.content, spec.stamp),
    );
  }
  if (tombstones.length > 0) out.tombstones = tombstones;
  return out;
}

// A tombstone's `table` always names the table the row actually lived in —
// deleteRow(table, id) writes `table: table.name` alongside the row's own id
// (write.ts:150). A tombstone pointing at a table its id never belonged to is
// not a state production can produce, so we don't generate one. (merge()'s guard
// against exactly that mismatch is still pinned, in golden fixture 12.)
const arbTombstone = (stamps: readonly string[]) =>
  fc.constantFrom(...TABLES).chain((table) =>
    fc.record({
      id: fc.constantFrom(...IDS_BY_TABLE[table]),
      table: fc.constant(table) as fc.Arbitrary<string>,
      deleted_at: fc.constantFrom(...stamps),
    }),
  );

export function arbSnapshot(
  opts: {
    stamps?: readonly string[];
    legacy?: boolean;
    tombstones?: boolean;
    maxRows?: number;
  } = {},
): fc.Arbitrary<Snapshot> {
  const {
    stamps = WIDE_STAMPS,
    legacy = false,
    tombstones = true,
    maxRows = 5,
  } = opts;
  return fc
    .tuple(
      fc.array(arbRowSpec(stamps, legacy), { maxLength: maxRows }),
      tombstones
        ? fc.array(arbTombstone(stamps), { maxLength: 2 })
        : fc.constant([] as TombstoneRow[]),
    )
    .map(([specs, tombs]) => {
      // A snapshot cannot carry two tombstones for the same id (id is the PK).
      const byId = new Map(tombs.map((t) => [t.id, t]));
      return specsToSnapshot(specs, [...byId.values()]);
    });
}

function rowsOf(snap: Snapshot, table: TableName): Map<string, ProductRow> {
  const rows = (snap[table] ?? []) as ProductRow[];
  return new Map(rows.map((r) => [r.id, r]));
}

/** Does merging these two snapshots hit the strict-`>` tie in merge()? True iff
 *  some row exists on BOTH sides with an EQUAL stamp and DIFFERENT content.
 *  Equal stamp + equal content is harmless: both sides already agree. */
export function hasConflictingTie(a: Snapshot, b: Snapshot): boolean {
  for (const table of TABLES) {
    const left = rowsOf(a, table);
    const right = rowsOf(b, table);
    for (const [id, l] of left) {
      const r = right.get(id);
      if (!r) continue;
      const ls = l.updated_at ?? l.created_at;
      const rs = r.updated_at ?? r.created_at;
      if (ls === rs && JSON.stringify(l) !== JSON.stringify(r)) return true;
    }
  }
  const lt = new Map(
    ((a.tombstones ?? []) as TombstoneRow[]).map((t) => [t.id, t]),
  );
  for (const t of (b.tombstones ?? []) as TombstoneRow[]) {
    const l = lt.get(t.id);
    if (l && l.deleted_at === t.deleted_at && l.table !== t.table) return true;
  }
  return false;
}

/** A snapshot pair that is a conflicting tie BY CONSTRUCTION — used by the
 *  known-violation property, which must fail deterministically (an `it.fails`
 *  that only sometimes fails is worse than no test). */
export function arbConflictingTiePair(): fc.Arbitrary<[Snapshot, Snapshot]> {
  return fc
    .constantFrom(...TABLES)
    .chain((table) =>
      fc.record({
        table: fc.constant(table),
        id: fc.constantFrom(...IDS_BY_TABLE[table]),
        stamp: fc.constantFrom(...TIE_STAMPS),
        left: fc.constantFrom('A', 'B'),
      }),
    )
    .map(({ table, id, stamp, left }) => {
      const right = left === 'A' ? 'B' : 'A';
      return [
        { [table]: [BUILDERS[table](id, left, stamp)] },
        { [table]: [BUILDERS[table](id, right, stamp)] },
      ] as [Snapshot, Snapshot];
    });
}
