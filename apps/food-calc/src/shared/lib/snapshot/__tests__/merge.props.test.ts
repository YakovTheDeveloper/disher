import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { db } from '@/shared/lib/dexie/schema';
import { dump, type Snapshot } from '@/shared/lib/snapshot';
import { mergeSeq, canon, resetWorld, seedLocal } from './support/world';
import {
  arbSnapshot,
  arbConflictingTiePair,
  hasConflictingTie,
  productRow,
  TIE_STAMPS,
  NO_MILLIS_STAMP,
  SAME_SECOND_WITH_MILLIS,
} from './support/arbitraries';

// Algebraic properties of merge(), and characterisations of the places where it
// does NOT have them.
//
// Registry of the underlying invariants: tds/ANALYSIS/sync-invariants.md.
//
// Two kinds of test live here, and the difference is load-bearing:
//
//   • GREEN properties — what merge() genuinely guarantees. A red one is a
//     regression.
//   • KNOWN-VIOLATION pairs — a characterisation test that PINS the current
//     (wrong) behaviour so a second client can be built bit-compatible with
//     production, plus an `it.fails` stating the property we actually want. When
//     the bug is fixed the `it.fails` starts passing (and fails the suite,
//     loudly, because `it.fails` demands failure) and the characterisation goes
//     red — both are the signal to update this file. Neither is allowed to exist
//     alone: a bare `it.fails` documents a wish, not a behaviour.

const NUM_RUNS = Number(process.env.FC_NUM_RUNS) || 50;
const PROP_TIMEOUT = 120_000;

const runs = { numRuns: NUM_RUNS };

describe('merge() — properties that hold', () => {
  it(
    'idempotent: merging the same blob twice equals merging it once',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbSnapshot({ legacy: true }),
          arbSnapshot({ legacy: true }),
          async (local, incoming) => {
            const once = await mergeSeq(local, incoming);
            const twice = await mergeSeq(local, incoming, incoming);
            expect(twice).toEqual(once);
          },
        ),
        runs,
      );
    },
    PROP_TIMEOUT,
  );

  it(
    'commutative when no stamps tie: merge order does not change the result',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbSnapshot(),
          arbSnapshot(),
          arbSnapshot(),
          async (local, a, b) => {
            // The tie is the ONE thing that breaks commutativity (see the
            // known-violation block below). Exclude it here so this property
            // says something precise: absent ties, merge IS commutative.
            fc.pre(
              !hasConflictingTie(local, a) &&
                !hasConflictingTie(local, b) &&
                !hasConflictingTie(a, b),
            );
            const ab = await mergeSeq(local, a, b);
            const ba = await mergeSeq(local, b, a);
            expect(ba).toEqual(ab);
          },
        ),
        runs,
      );
    },
    PROP_TIMEOUT,
  );

  it(
    'associative when no stamps tie: (L⊕A)⊕B == L⊕(A⊕B)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbSnapshot(),
          arbSnapshot(),
          arbSnapshot(),
          async (local, a, b) => {
            fc.pre(
              !hasConflictingTie(local, a) &&
                !hasConflictingTie(local, b) &&
                !hasConflictingTie(a, b),
            );
            const leftAssoc = await mergeSeq(local, a, b);
            const aThenB = await mergeSeq(a, b); // fold A and B into one blob first
            const rightAssoc = await mergeSeq(local, aThenB);
            expect(rightAssoc).toEqual(leftAssoc);
          },
        ),
        runs,
      );
    },
    PROP_TIMEOUT,
  );

  it(
    'converges: after a pairwise exchange, a second exchange changes nothing',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbSnapshot(),
          arbSnapshot(),
          async (d0, d1) => {
            fc.pre(!hasConflictingTie(d0, d1));
            const d0After = await mergeSeq(d0, d1);
            const d1After = await mergeSeq(d1, d0);
            expect(d1After).toEqual(d0After); // converged
            // Fixed point: re-merging the converged state is a no-op.
            expect(await mergeSeq(d0After, d1After)).toEqual(d0After);
          },
        ),
        runs,
      );
    },
    PROP_TIMEOUT,
  );

  it(
    'union by presence: a table key absent from the incoming blob never drops a local row',
    async () => {
      await fc.assert(
        fc.asyncProperty(arbSnapshot({ tombstones: false }), async (local) => {
          // The И-5 half that DOES hold: merge() ignores unknown/absent keys
          // rather than treating them as deletions. (What does NOT hold is the
          // round-trip — dump() cannot re-emit a table the local schema lacks.)
          const merged = await mergeSeq(local, {});
          expect(merged).toEqual(canon(local));
        }),
        runs,
      );
    },
    PROP_TIMEOUT,
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// KNOWN-VIOLATION: equal stamps + different content → permanent divergence.
// Registry: И-2. merge() compares with a STRICT `>` (snapshot/index.ts:116), so
// on a tie the incoming row loses and the LOCAL side always survives. Whoever
// runs merge() therefore decides the outcome, and the two devices never
// reconcile. Reachable in production: nextStamp() degenerates into the
// deterministic counter `hwm+1` whenever the high-water mark outruns the wall
// clock, so two peers that observed the same HWM emit IDENTICAL stamps.
// ─────────────────────────────────────────────────────────────────────────────
describe('merge() — KNOWN-VIOLATION: tie on updated_at', () => {
  const STAMP = TIE_STAMPS[0];

  it('CHARACTERISATION: on a tie the local row wins and the incoming one is dropped', async () => {
    await resetWorld();
    await seedLocal({ products: [productRow('p1', 'local-A', STAMP)] });

    const merged = await mergeSeq(
      { products: [productRow('p1', 'local-A', STAMP)] },
      { products: [productRow('p1', 'incoming-B', STAMP)] },
    );

    expect((merged.products as Array<{ name: string }>)[0].name).toBe('local-A');
  });

  it('CHARACTERISATION: two devices with a tie diverge permanently — extra syncs do not help', async () => {
    const d0Blob: Snapshot = { products: [productRow('p1', 'A', STAMP)] };
    const d1Blob: Snapshot = { products: [productRow('p1', 'B', STAMP)] };

    // Round 1: each device merges the other's blob.
    const d0 = await mergeSeq(d0Blob, d1Blob);
    const d1 = await mergeSeq(d1Blob, d0Blob);
    expect((d0.products as Array<{ name: string }>)[0].name).toBe('A');
    expect((d1.products as Array<{ name: string }>)[0].name).toBe('B');

    // Round 2 and 3: still nothing reconciles them. This is the whole point —
    // it is not a transient race, it is a fixed point of disagreement.
    const d0Again = await mergeSeq(d0, d1);
    const d1Again = await mergeSeq(d1, d0);
    expect((d0Again.products as Array<{ name: string }>)[0].name).toBe('A');
    expect((d1Again.products as Array<{ name: string }>)[0].name).toBe('B');
    expect(d0Again).not.toEqual(d1Again);
  });

  it.fails(
    'WANTED (fails today): merge is commutative even when stamps tie',
    async () => {
      await fc.assert(
        fc.asyncProperty(arbConflictingTiePair(), async ([a, b]) => {
          // Device holding A merges B; device holding B merges A. A convergent
          // merge would land both on the same row. Ours lands them on their own.
          const fromA = await mergeSeq(a, b);
          const fromB = await mergeSeq(b, a);
          expect(fromB).toEqual(fromA);
        }),
        runs,
      );
    },
    PROP_TIMEOUT,
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// KNOWN-VIOLATION: stamps are compared as STRINGS, so the comparison is only
// chronological for the exact `toISOString()` shape (millis always 3 digits).
// Registry: И-4. A stamp whose millisecond field is zero and omitted —
// `2026-03-01T10:05:00Z`, which is what Kotlin's Instant.toString() emits —
// sorts AFTER every stamp in the same second that carries millis, because
// 'Z' (0x5A) > '.' (0x2E). The LWW order inverts: an older edit overwrites a
// newer one. No JS writer can produce this shape; a second writer will.
// ─────────────────────────────────────────────────────────────────────────────
describe('merge() — KNOWN-VIOLATION: ISO stamp without milliseconds', () => {
  it('CHARACTERISATION: a chronologically OLDER no-millis stamp beats a newer one', async () => {
    // Ground truth: the local row is 1ms LATER than the incoming one.
    expect(Date.parse(SAME_SECOND_WITH_MILLIS)).toBeGreaterThan(
      Date.parse(NO_MILLIS_STAMP),
    );

    const merged = await mergeSeq(
      { products: [productRow('p1', 'newer-local', SAME_SECOND_WITH_MILLIS)] },
      { products: [productRow('p1', 'older-incoming', NO_MILLIS_STAMP)] },
    );

    // …and yet the older row wins, because string order says so.
    expect((merged.products as Array<{ name: string }>)[0].name).toBe(
      'older-incoming',
    );
  });

  it.fails(
    'WANTED (fails today): the chronologically newer row wins regardless of stamp format',
    async () => {
      const merged = await mergeSeq(
        { products: [productRow('p1', 'newer-local', SAME_SECOND_WITH_MILLIS)] },
        { products: [productRow('p1', 'older-incoming', NO_MILLIS_STAMP)] },
      );
      expect((merged.products as Array<{ name: string }>)[0].name).toBe(
        'newer-local',
      );
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// И-11 — row ids must be unique across the WHOLE database, not per table.
//
// This is not a style rule, and these tests exist to prove it. merge() keys its
// tombstone map by the bare id (`Map<string, TombstoneRow>`, snapshot/index.ts:92)
// — the `table` field rides along as data and only decides which table the
// SURVIVING tombstone gets applied to. So two tombstones sharing an id contend
// for one slot, the later `deleted_at` evicts the earlier, and the evicted
// delete is lost outright: the row it covered stays alive.
//
// Production upholds the precondition (ids are crypto.randomUUID()), so nothing
// below is reachable today. It IS reachable for a second writer that scopes ids
// per table (auto-increment, composite keys) — and the damage is not a lost
// delete on one row, it is merge losing commutativity and associativity
// altogether. These two cases were found by the property tests above, when the
// generator was still drawing ids from a pool shared across tables.
// ─────────────────────────────────────────────────────────────────────────────
describe('merge() — И-11: an id shared across tables breaks the tombstone track', () => {
  const T0 = TIE_STAMPS[0];
  const LATER = '2026-03-01T10:08:00.000Z';

  it('CHARACTERISATION: a tombstone for another table evicts this row’s tombstone, and the delete is lost', async () => {
    // 'x1' names a products row AND (illegally) an insights row.
    const local: Snapshot = { products: [productRow('x1', 'doomed', T0)] };
    const deleteIt: Snapshot = {
      tombstones: [{ id: 'x1', table: 'products', deleted_at: T0 }],
    };
    const unrelatedDelete: Snapshot = {
      tombstones: [{ id: 'x1', table: 'insights', deleted_at: LATER }],
    };

    // Order 1: apply the products delete first — the row dies, and only then is
    // its tombstone evicted by the newer insights one. The row stays dead.
    const deleteThenEvict = await mergeSeq(local, deleteIt, unrelatedDelete);
    expect(deleteThenEvict.products).toBeUndefined();

    // Order 2: the insights tombstone lands first. Now the products tombstone
    // (older) LOSES the LWW and never lands at all — so nothing ever deletes the
    // row. Same two blobs, opposite outcome.
    const evictThenDelete = await mergeSeq(local, unrelatedDelete, deleteIt);
    expect(evictThenDelete.products).toHaveLength(1);
  });

  it.fails(
    'WANTED (fails today): merge stays commutative when two tables share a row id',
    async () => {
      const local: Snapshot = { products: [productRow('x1', 'doomed', T0)] };
      const a: Snapshot = {
        tombstones: [{ id: 'x1', table: 'products', deleted_at: T0 }],
      };
      const b: Snapshot = {
        tombstones: [{ id: 'x1', table: 'insights', deleted_at: LATER }],
      };
      expect(await mergeSeq(local, b, a)).toEqual(await mergeSeq(local, a, b));
    },
    PROP_TIMEOUT,
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// KNOWN-VIOLATION: a client whose schema lacks a domain table cannot carry that
// table through a round-trip. Registry: И-5. merge() only reads DOMAIN_TABLES
// (a local const) and dump() only reads db.tables (the local schema), while the
// server does a whole-blob REPLACE — so nothing anywhere preserves a key the
// pushing client does not know. Modelled here at the merge boundary; the full
// pull→merge→dump→push loss is exercised in two-device-sim.test.ts.
// ─────────────────────────────────────────────────────────────────────────────
describe('merge() — KNOWN-VIOLATION: unknown table keys are not preserved', () => {
  it('CHARACTERISATION: a key outside DOMAIN_TABLES is silently dropped, not carried', async () => {
    await resetWorld();
    await mergeSeq(
      {},
      {
        products: [productRow('p1', 'kept', TIE_STAMPS[0])],
        // A table a FUTURE schema adds — from this client's point of view, an
        // unknown key. A client that preserved unknown keys would hold it
        // somewhere and re-emit it on dump(). This one has nowhere to put it.
        future_table: [{ id: 'f1', updated_at: TIE_STAMPS[0] }],
      } as Snapshot,
    );

    expect(await db.products.count()).toBe(1);
    expect(Object.keys(await dump())).not.toContain('future_table');
  });
});
