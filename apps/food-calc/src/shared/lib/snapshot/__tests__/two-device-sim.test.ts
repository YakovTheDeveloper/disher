import { describe, it, expect, afterEach } from 'vitest';
import { vi } from 'vitest';
import fc from 'fast-check';
import { World } from './support/simulator';

// Two offline devices sharing one server blob. The gap this closes: every
// existing snapshot test drives merge() directly, so nothing exercised the loop
// that actually loses data in production — pull → merge → prune → PUSH, where
// the push is a whole-blob replace.
//
// Expectations are derived from `world.log` (what ACTUALLY executed) rather than
// from the generated op list: the interpreter is total, so "delete p3" when p3
// was never created is a logged no-op, and an expectation built from the
// generated ops would be wrong.
//
// The derivation leans on one fact: with autoTickMs = 1 the wall clock advances
// before every op and always outruns the high-water mark, so stamps are strictly
// increasing in EXECUTION order. The last executed op on a row therefore holds
// the highest stamp and wins LWW globally. (That is precisely the assumption the
// tie tests below break on purpose.)

const NUM_RUNS = Number(process.env.FC_NUM_RUNS) || 25;
const PROP_TIMEOUT = 120_000;

afterEach(() => {
  vi.useRealTimers();
});

type Op =
  | { kind: 'put'; device: number; id: string; content: string }
  | { kind: 'del'; device: number; id: string }
  | { kind: 'sync'; device: number };

const arbOp: fc.Arbitrary<Op> = fc.oneof(
  fc.record({
    kind: fc.constant('put' as const),
    device: fc.constantFrom(0, 1),
    id: fc.constantFrom('p1', 'p2', 'p3'),
    content: fc.constantFrom('A', 'B', 'C'),
  }),
  fc.record({
    kind: fc.constant('del' as const),
    device: fc.constantFrom(0, 1),
    id: fc.constantFrom('p1', 'p2', 'p3'),
  }),
  fc.record({
    kind: fc.constant('sync' as const),
    device: fc.constantFrom(0, 1),
  }),
);

async function runOps(world: World, ops: Op[]): Promise<void> {
  for (const op of ops) {
    if (op.kind === 'put') await world.put(op.device, op.id, op.content);
    else if (op.kind === 'del') await world.del(op.device, op.id);
    else await world.sync(op.device);
  }
}

/** Quiesce: sync both devices until nothing can move. Two rounds is enough —
 *  round 1 gives each device the other's state, round 2 makes it a fixed point. */
async function quiesce(world: World): Promise<void> {
  await world.sync(0);
  await world.sync(1);
  await world.sync(0);
  await world.sync(1);
}

/** The last EXECUTED op per row id, read back off the log. */
function finalOps(log: readonly string[]): Map<string, 'put' | 'del'> {
  const out = new Map<string, 'put' | 'del'>();
  for (const line of log) {
    if (line.includes('(no-op')) continue;
    const put = /\bput (p\d)=/.exec(line);
    if (put) {
      out.set(put[1], 'put');
      continue;
    }
    const del = /\bdel (p\d)\b/.exec(line);
    if (del) out.set(del[1], 'del');
  }
  return out;
}

describe('two devices — properties that hold (unique stamps)', () => {
  it(
    'converges: after both devices quiesce, they hold identical state, equal to the server blob',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.array(arbOp, { maxLength: 12 }), async (ops) => {
          const world = new World({ autoTickMs: 1 });
          await world.boot();
          await runOps(world, ops);
          await quiesce(world);

          const d0 = await world.stateOf(0);
          const d1 = await world.stateOf(1);
          expect(d1).toEqual(d0);
          expect(world.serverState()).toEqual(d0);
        }),
        { numRuns: NUM_RUNS },
      );
    },
    PROP_TIMEOUT,
  );

  it(
    'survives: a row whose last executed op is a put exists on BOTH devices afterwards',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.array(arbOp, { maxLength: 12 }), async (ops) => {
          const world = new World({ autoTickMs: 1 });
          await world.boot();
          await runOps(world, ops);
          await quiesce(world);

          for (const [id, last] of finalOps(world.log)) {
            if (last !== 'put') continue;
            expect(await world.productOn(0, id)).toBeDefined();
            expect(await world.productOn(1, id)).toBeDefined();
          }
        }),
        { numRuns: NUM_RUNS },
      );
    },
    PROP_TIMEOUT,
  );

  it(
    'deletes: a row whose last executed op is a delete is gone from both devices, and its tombstone rides the blob',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.array(arbOp, { maxLength: 12 }), async (ops) => {
          const world = new World({ autoTickMs: 1 });
          await world.boot();
          await runOps(world, ops);
          await quiesce(world);

          const blobTombstones = new Set(
            ((world.serverState().tombstones ?? []) as Array<{ id: string }>).map(
              (t) => t.id,
            ),
          );

          for (const [id, last] of finalOps(world.log)) {
            if (last !== 'del') continue;
            expect(await world.productOn(0, id)).toBeUndefined();
            expect(await world.productOn(1, id)).toBeUndefined();
            // The tombstone must survive locally AND in the pushed blob —
            // otherwise a third device would re-adopt the row.
            expect(await world.tombstoneOn(0, id)).toBe(true);
            expect(await world.tombstoneOn(1, id)).toBe(true);
            expect(blobTombstones.has(id)).toBe(true);
          }
        }),
        { numRuns: NUM_RUNS },
      );
    },
    PROP_TIMEOUT,
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// KNOWN-VIOLATION — И-2. With the wall clock frozen (autoTickMs: 0) both devices'
// nextStamp() collapses onto the same value, which is exactly what happens in
// production once the high-water mark outruns the wall clock: nextStamp()
// degenerates into the deterministic counter `hwm+1`, identical on every peer
// that observed the same HWM.
// ─────────────────────────────────────────────────────────────────────────────
describe('two devices — KNOWN-VIOLATION: tied stamps diverge permanently', () => {
  it('CHARACTERISATION: concurrent edits with equal stamps never reconcile, and the blob flip-flops', async () => {
    const world = new World({ autoTickMs: 0 });
    await world.boot();

    await world.put(0, 'p1', 'A');
    await world.put(1, 'p1', 'B'); // same frozen millisecond → identical stamp

    await world.sync(0);
    expect((world.serverState().products as Array<{ name: string }>)[0].name).toBe('A');

    await world.sync(1); // D1 merges D0's blob — the tie makes D1 keep its own
    expect((world.serverState().products as Array<{ name: string }>)[0].name).toBe('B');

    await world.sync(0); // …and D0 keeps its own. The blob just flipped back.
    expect((world.serverState().products as Array<{ name: string }>)[0].name).toBe('A');

    // Extra syncs change nothing: this is a fixed point of disagreement.
    await world.sync(1);
    await world.sync(0);
    await world.sync(1);

    expect(await world.productOn(0, 'p1')).toBe('A');
    expect(await world.productOn(1, 'p1')).toBe('B');
  });

  it.fails(
    'WANTED (fails today): devices converge even when their stamps tie',
    async () => {
      const world = new World({ autoTickMs: 0 });
      await world.boot();

      await world.put(0, 'p1', 'A');
      await world.put(1, 'p1', 'B');
      await quiesce(world);

      expect(await world.productOn(1, 'p1')).toBe(await world.productOn(0, 'p1'));
    },
    PROP_TIMEOUT,
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// KNOWN-VIOLATION — И-5. A client whose schema predates a domain table destroys
// that table in the shared vault. Not because merge() is destructive — because
// nothing in the loop preserves a key the pushing client does not know:
// merge() reads its own DOMAIN_TABLES, dump() reads its own db.tables, and the
// server does `set snapshot = excluded.snapshot` (a whole-blob REPLACE).
// ─────────────────────────────────────────────────────────────────────────────
describe('two devices — KNOWN-VIOLATION: an old-schema client wipes a table it does not know', () => {
  it('CHARACTERISATION: a legacy client round-tripping the blob erases `insights` from the vault', async () => {
    const world = new World({ autoTickMs: 1 });
    await world.boot();

    // D0 is on the current schema and saves an insight.
    await world.putInsight(0, 'i1', 'iron+C');
    await world.sync(0);
    expect(world.serverState().insights).toHaveLength(1);

    // D1 runs a build that predates schema v8. One sync — pull, merge, push.
    // It never touched `insights`; it simply had nowhere to put it and nothing
    // to emit it from.
    await world.syncLegacy(1);

    // The vault no longer has the key at all. This blob is what a FRESH device
    // pulls on first launch — it would see zero insights.
    expect(world.serverState().insights).toBeUndefined();
  });

  it('CHARACTERISATION: the loss is silent and only materialises once the last modern device loses its copy', async () => {
    const world = new World({ autoTickMs: 1 });
    await world.boot();

    await world.putInsight(0, 'i1', 'iron+C');
    await world.sync(0);
    await world.syncLegacy(1);

    // D0 still holds it locally — union-by-presence means merge() never deleted
    // it — so D0's next sync puts it back. This is why the bug is invisible in
    // day-to-day use, and why it surfaces as "my insights vanished" only after a
    // reinstall / sign-out / new device, when the vault was the last copy.
    const d0Insights = (await world.stateOf(0)).insights as unknown[] | undefined;
    expect(d0Insights).toHaveLength(1);

    await world.sync(0);
    expect(world.serverState().insights).toHaveLength(1);
  });

  it.fails(
    'WANTED (fails today): a client that does not know a table leaves it intact in the vault',
    async () => {
      const world = new World({ autoTickMs: 1 });
      await world.boot();

      await world.putInsight(0, 'i1', 'iron+C');
      await world.sync(0);
      await world.syncLegacy(1);

      expect(world.serverState().insights).toHaveLength(1);
    },
    PROP_TIMEOUT,
  );
});
