import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { pickIdsSafeToClean, type GuardCandidate } from '../timestampGuard';

// 8.7 Notesnook timestamp guard regression (P1).
//
// Race scenario the guard prevents:
//   t=0   user mutates row A → cma=t0
//   t=10  drain captures pushTimestamp=t10, reads dirty rows including A
//   t=15  network in flight; user mutates A again → cma=t15
//   t=20  server ACKs A
//   --- without guard: drain clears A._dirty=0 → the t15 edit is lost ---
//   --- with guard: cma(t15) > pushTimestamp(t10) → keep _dirty=1 ---
//
// pickIdsSafeToClean returns the subset of acked rows whose cma <= pushTimestamp.

const ISO = (ms: number) => new Date(ms).toISOString();

describe('pickIdsSafeToClean — concrete cases', () => {
  it('clears row whose cma == pushTimestamp (boundary, <= comparison)', () => {
    const ts = ISO(1000);
    expect(
      pickIdsSafeToClean([{ id: 'a', client_modified_at: ts }], ts),
    ).toEqual(['a']);
  });

  it('clears row whose cma < pushTimestamp', () => {
    const ts = ISO(1000);
    expect(
      pickIdsSafeToClean([{ id: 'a', client_modified_at: ISO(900) }], ts),
    ).toEqual(['a']);
  });

  it('does NOT clear row mutated mid-flight (cma > pushTimestamp)', () => {
    const ts = ISO(1000);
    expect(
      pickIdsSafeToClean([{ id: 'a', client_modified_at: ISO(1500) }], ts),
    ).toEqual([]);
  });

  it('partitions a mixed batch correctly', () => {
    const ts = ISO(1000);
    const rows: GuardCandidate[] = [
      { id: 'safe-1',   client_modified_at: ISO(500) },
      { id: 'safe-2',   client_modified_at: ISO(1000) }, // boundary
      { id: 'racey-1',  client_modified_at: ISO(1001) },
      { id: 'racey-2',  client_modified_at: ISO(99999) },
    ];
    expect(pickIdsSafeToClean(rows, ts).sort()).toEqual(['safe-1', 'safe-2']);
  });

  it('regression: full Notesnook race (t=0 dirty, drain at t=10, mutate at t=15, ack at t=20)', () => {
    // Snapshot AFTER server ACK (i.e. row is in Dexie post-mutation):
    //   row.client_modified_at = t=15 ISO  (mutated mid-flight)
    //   pushTimestamp           = t=10 ISO
    // Guard must NOT clear this id.
    const pushTimestamp = ISO(10);
    const acked: GuardCandidate[] = [
      { id: 'A', client_modified_at: ISO(15) },
    ];
    expect(pickIdsSafeToClean(acked, pushTimestamp)).toEqual([]);
  });

  it('handles empty input', () => {
    expect(pickIdsSafeToClean([], ISO(0))).toEqual([]);
  });
});

describe('pickIdsSafeToClean — property-based', () => {
  const candidateArb = (): fc.Arbitrary<GuardCandidate> =>
    fc.record({
      id: fc.uuid(),
      client_modified_at: fc.integer({ min: 0, max: 100_000 }).map(ISO),
    });

  it('result is a subset of input ids', () => {
    fc.assert(
      fc.property(
        fc.array(candidateArb(), { maxLength: 50 }),
        fc.integer({ min: 0, max: 100_000 }),
        (rows, ts) => {
          const inputIds = new Set(rows.map((r) => r.id));
          const outIds = pickIdsSafeToClean(rows, ISO(ts));
          return outIds.every((id) => inputIds.has(id));
        },
      ),
    );
  });

  it('every selected id has cma <= pushTimestamp; every rejected id has cma > pushTimestamp', () => {
    fc.assert(
      fc.property(
        fc.array(candidateArb(), { maxLength: 50 }),
        fc.integer({ min: 0, max: 100_000 }),
        (rows, ts) => {
          const tsIso = ISO(ts);
          const safeSet = new Set(pickIdsSafeToClean(rows, tsIso));
          for (const r of rows) {
            const ok = r.client_modified_at <= tsIso;
            if (safeSet.has(r.id) !== ok) return false;
          }
          return true;
        },
      ),
    );
  });

  it('monotonic in pushTimestamp: increasing ts only ever adds ids, never removes', () => {
    fc.assert(
      fc.property(
        fc.array(candidateArb(), { maxLength: 50 }),
        fc.integer({ min: 0, max: 50_000 }),
        fc.integer({ min: 1, max: 50_000 }),
        (rows, t1, delta) => {
          const a = new Set(pickIdsSafeToClean(rows, ISO(t1)));
          const b = new Set(pickIdsSafeToClean(rows, ISO(t1 + delta)));
          for (const id of a) if (!b.has(id)) return false;
          return true;
        },
      ),
    );
  });

  it('idempotent: calling twice yields same result', () => {
    fc.assert(
      fc.property(
        fc.array(candidateArb(), { maxLength: 30 }),
        fc.integer({ min: 0, max: 100_000 }),
        (rows, ts) => {
          const a = pickIdsSafeToClean(rows, ISO(ts)).sort();
          const b = pickIdsSafeToClean(rows, ISO(ts)).sort();
          return JSON.stringify(a) === JSON.stringify(b);
        },
      ),
    );
  });
});
