import { vi } from 'vitest';
import { db } from '@/shared/lib/dexie/schema';
import {
  dump,
  apply,
  merge,
  pruneTombstones,
  type Snapshot,
} from '@/shared/lib/snapshot';
import { putRow, deleteRow } from '@/shared/lib/dexie/write';
import { canon, readHwm, writeHwm, resetWorld } from './world';

// Two offline devices + one server blob, driven through the REAL write contract
// and the REAL merge(). Nothing is mocked: putRow/deleteRow stamp through the
// production monotonic clock, sync() is a byte-for-byte replica of syncNow()'s
// pull → merge → prune → push with the HTTP hop removed.
//
// This closes the two-device e2e gap that was deferred by hand on 2026-05-30
// (.claude/ralph/fix_plan.md).
//
// ── How one Dexie serves two devices ────────────────────────────────────────
// There is exactly one `db` singleton in the process. A device is therefore a
// PARKED (snapshot, hwm) pair, and activate() swaps it in: dump the incumbent,
// apply() the challenger, swap the localStorage high-water mark. The HWM must
// travel with the device — it IS the device's clock, and sharing one across both
// would silently paper over exactly the ordering bugs this simulator exists to
// find.
//
// ── Fake time ───────────────────────────────────────────────────────────────
// `toFake: ['Date']` is not a style choice. vitest's default fake-timer set also
// fakes the task queue, which fake-indexeddb schedules its transactions on — the
// whole suite then hangs forever. Fake Date only.
//
// ── autoTickMs ──────────────────────────────────────────────────────────────
//   1 → the wall clock advances before every op, so nextStamp() always beats the
//       high-water mark and every stamp in the world is unique. This is the
//       HEALTHY fleet, and it is where the convergence properties must hold.
//   0 → the clock is frozen, so both devices' nextStamp() collapses onto the
//       same value. This is the DEGENERATE regime of И-2, reproduced on purpose.

export interface SimOptions {
  /** Milliseconds to advance the wall clock before each op. 0 makes ties. */
  autoTickMs?: number;
  /** Wall-clock origin. Defaults to a fixed date well inside the 90-day
   *  tombstone TTL, so pruneTombstones() never fires by accident. */
  t0?: number;
}

interface Device {
  snapshot: Snapshot;
  hwm: number;
}

const DEFAULT_T0 = Date.UTC(2026, 6, 1, 12, 0, 0);

export class World {
  private devices: Device[] = [
    { snapshot: {}, hwm: 0 },
    { snapshot: {}, hwm: 0 },
  ];
  private active = 0;
  private now: number;
  private readonly autoTickMs: number;

  /** The server vault. `null` = no row yet (GET would 404). */
  server: Snapshot | null = null;

  /** Ops that ACTUALLY executed, in order. Assertions derive their expectations
   *  from this — never from the generated op list, which may contain impossible
   *  ops (delete a row that isn't there) that the interpreter turns into no-ops. */
  readonly log: string[] = [];

  constructor(opts: SimOptions = {}) {
    this.autoTickMs = opts.autoTickMs ?? 1;
    this.now = opts.t0 ?? DEFAULT_T0;
  }

  /** Must be awaited before any op. Also installs fake Date. */
  async boot(): Promise<void> {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(this.now);
    await resetWorld();
    this.devices = [
      { snapshot: {}, hwm: 0 },
      { snapshot: {}, hwm: 0 },
    ];
    this.active = 0;
    this.server = null;
    this.log.length = 0;
  }

  tick(ms: number): void {
    this.now += ms;
    vi.setSystemTime(this.now);
  }

  private autoTick(): void {
    if (this.autoTickMs > 0) this.tick(this.autoTickMs);
  }

  private async activate(d: number): Promise<void> {
    if (this.active === d) return;
    this.devices[this.active].snapshot = await dump();
    this.devices[this.active].hwm = readHwm();
    // apply() is legal here: every row a device holds is already stamped, so its
    // `updated_at ??= created_at` backfill is a no-op. (That backfill is exactly
    // why the merge harness seeds raw instead — see world.ts.)
    await apply(structuredClone(this.devices[d].snapshot));
    writeHwm(this.devices[d].hwm);
    this.active = d;
  }

  async put(d: number, id: string, content: string): Promise<void> {
    await this.activate(d);
    this.autoTick();
    const existing = await db.products.get(id);
    await putRow(db.products, {
      id,
      name: content,
      source: '',
      nutrients: {},
      portions: [],
      categories: [],
      serving_basis: '100g',
      serving_unit: null,
      description: '',
      created_at: existing?.created_at ?? new Date().toISOString(),
    });
    this.log.push(`D${d} put ${id}=${content}`);
  }

  async putInsight(d: number, id: string, content: string): Promise<void> {
    await this.activate(d);
    this.autoTick();
    await putRow(db.insights, {
      id,
      title: content,
      detail: 'd',
      valence: 'neutral',
      strength: 'weak',
      evidence: { days: [] },
      source: 'daily',
      created_at: new Date().toISOString(),
    });
    this.log.push(`D${d} putInsight ${id}=${content}`);
  }

  /** Total interpreter: deleting an absent row is a no-op, not a throw. Keeps
   *  generated op sequences shrink-friendly. */
  async del(d: number, id: string): Promise<void> {
    await this.activate(d);
    this.autoTick();
    if (!(await db.products.get(id))) {
      this.log.push(`D${d} del ${id} (no-op: absent)`);
      return;
    }
    await deleteRow(db.products, id);
    this.log.push(`D${d} del ${id}`);
  }

  /** syncNow() with the HTTP hop removed: pull → merge → prune → push. */
  async sync(d: number): Promise<void> {
    await this.activate(d);
    this.autoTick();
    if (this.server) await merge(structuredClone(this.server));
    await pruneTombstones();
    this.server = await dump();
    this.log.push(`D${d} sync`);
  }

  /** A client whose schema PREDATES the `insights` table (И-5). It cannot read
   *  the key on the way in (merge() iterates its own DOMAIN_TABLES) and cannot
   *  emit it on the way out (dump() iterates its own db.tables). The server does
   *  a whole-blob replace, so the key is gone from the vault.
   *
   *  Fidelity limit: the process has one Dexie schema, so we model the missing
   *  table by stripping the key on both boundaries rather than by opening an
   *  older objectStore set. The data path is identical. */
  async syncLegacy(d: number): Promise<void> {
    await this.activate(d);
    this.autoTick();
    if (this.server) {
      const incoming = structuredClone(this.server);
      delete incoming.insights;
      await merge(incoming);
    }
    await pruneTombstones();
    const pushed = await dump();
    delete pushed.insights;
    this.server = pushed;
    this.log.push(`D${d} syncLegacy`);
  }

  /** Canonical state of a device. Parks the current device as a side effect. */
  async stateOf(d: number): Promise<Snapshot> {
    await this.activate(d);
    return canon(await dump());
  }

  serverState(): Snapshot {
    return canon(this.server ?? {});
  }

  async productOn(d: number, id: string): Promise<string | undefined> {
    await this.activate(d);
    return (await db.products.get(id))?.name;
  }

  async tombstoneOn(d: number, id: string): Promise<boolean> {
    await this.activate(d);
    return (await db.tombstones.get(id)) !== undefined;
  }
}
