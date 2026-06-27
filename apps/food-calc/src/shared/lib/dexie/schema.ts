import Dexie, { type Table } from 'dexie';

// Disher local Dexie DB. The user is the only writer per device; rows are
// pushed to / pulled from /api/backup as a single JSON blob and reconciled by
// the sync merge() via a per-row `updated_at` (LWW) key plus a `tombstones`
// table. Delete is hard (the row is removed) + a tombstone is recorded — the
// read path stays clean (no `deleted_at` filter in queries). No per-row
// `user_id` discriminator — sign-out wipes the DB.
//
// See apps/food-calc/tds/ANALYSIS/zero-base-rewrite-2026-05-09.md and the
// merge-sync fix plan (.claude/ralph/fix_plan.md).

// ─── per-table row interfaces ──────────────────────────────────────────────
//
// Every row carries two timestamps: `created_at` (stamped once at insert) and
// `updated_at` (re-stamped on every write — the per-row LWW key merge()
// compares; backfilled from created_at by the v7 upgrade). `id` is a uuid
// stamped at mutation time. Everything else is domain.

export interface ProductRow {
  id: string;
  name: string;
  source: string;
  /** Stored as a parsed object, not stringified. */
  nutrients: Record<string, unknown>;
  portions: Array<Record<string, unknown>>;
  categories: Array<unknown>;
  serving_basis: '100g' | 'serving';
  serving_unit: 'IU' | 'mg' | 'mcg' | 'g' | 'шт' | null;
  /** Optional thumbnail path (build-route catalog rows only; user products have none). */
  image?: string;
  created_at: string;
  updated_at: string;
}

export interface DishRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DishItemRow {
  id: string;
  dish_id: string;
  product_id: string;
  quantity: number;
  /** Per-ingredient note (e.g. "варёное", "печёное вместо жареного"). Empty
   *  string when the user didn't add a detail. Non-indexed — no schema bump
   *  needed; rows from pre-2026-05-13 snapshots fall back to '' in the mapper. */
  details: string;
  created_at: string;
  updated_at: string;
}

export interface DishPortionRow {
  id: string;
  dish_id: string;
  label: string;
  grams: number;
  created_at: string;
  updated_at: string;
}

export type ScheduleFoodType = 'food' | 'dish';

export interface ScheduleFoodRow {
  id: string;
  date: string;
  time: string;
  type: ScheduleFoodType;
  quantity: number;
  details: string;
  product_id: string | null;
  dish_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleEventRow {
  id: string;
  date: string;
  time: string;
  end_time: string;
  text: string;
  atoms: Array<unknown>;
  created_at: string;
  updated_at: string;
}

export interface DailyNormRow {
  id: string;
  name: string;
  description: string;
  items: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// A hypothesis the user wants to check. Simplified in v6 (2026-05-15): the
// old lifecycle model (testing/closed status, dates, outcome, private note,
// source-analysis link) is gone — a hypothesis is just a title + body the
// user attaches to an analysis via checkbox.
export interface HypothesisRow {
  id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
}

// An insight the user saved from an analysis result. Unlike a hypothesis (the
// user authors it), an insight only ever enters this table from an LLM answer
// («Сохранить» on an InsightCard) — there is no manual create. Read-only
// after save; the user can delete it. `valence` is good/bad (synergy vs
// antagonism), `strength` is confidence, `evidence` is the parsed grounding
// object ({days, foods?, events?}); `source` records which разбор produced it.
export interface InsightRow {
  id: string;
  title: string;
  detail: string;
  valence: 'positive' | 'negative' | 'neutral';
  strength: 'weak' | 'moderate' | 'clear';
  /** Stored as a parsed object, not stringified: {days, foods?, events?}. */
  evidence: Record<string, unknown>;
  source: 'daily' | 'dish' | 'long';
  created_at: string;
  updated_at: string;
}

// Per-product user-coined tags. The user types something into a schedule_food
// `details` textarea that isn't in TAG_SUGGESTIONS for that product's category
// — we remember it so next time the same product is selected, that tag shows
// up as a clickable chip. Keyed by product_id (catalog id or user products.id).
// `tag` is already normalised (lowercase, NFC, trimmed); the
// (product_id, tag) pair is unique by construction in the writer.
export interface CustomTagRow {
  id: string;
  product_id: string;
  tag: string;
  created_at: string;
  updated_at: string;
}

// A tombstone for a hard-deleted row. Written (alongside the row's removal, in
// one rw-tx) by the deleteRow/deleteRows write contract; read by merge() to
// suppress revival of a row another device still holds. Keyed by the deleted
// row's `id` (uuids are globally unique across tables); `table` records which
// domain table it belonged to so merge() can apply it; `deleted_at` is the LWW
// timestamp compared against a surviving row's `updated_at`.
export interface TombstoneRow {
  id: string;
  table: string;
  deleted_at: string;
}

// Drops the v5-era hypothesis lifecycle columns from a row, in place. Run by
// the v6 upgrade over every existing hypothesis row. Exported so the
// migration unit test can exercise the exact stripping logic the upgrade
// applies (the singleton `db` opens at v6, so old-shape data can't be seeded
// against it directly).
export function stripLegacyHypothesisFields(row: Record<string, unknown>): void {
  delete row.days;
  delete row.started_at;
  delete row.ended_at;
  delete row.outcome;
  delete row.source_analysis_id;
  delete row.note;
  delete row.saved_at;
}

// ─── DB ────────────────────────────────────────────────────────────────────

export class DisherDB extends Dexie {
  products!: Table<ProductRow, string>;
  dishes!: Table<DishRow, string>;
  dish_items!: Table<DishItemRow, string>;
  dish_portions!: Table<DishPortionRow, string>;
  schedule_foods!: Table<ScheduleFoodRow, string>;
  schedule_events!: Table<ScheduleEventRow, string>;
  daily_norms!: Table<DailyNormRow, string>;
  hypotheses!: Table<HypothesisRow, string>;
  insights!: Table<InsightRow, string>;
  custom_tags!: Table<CustomTagRow, string>;
  tombstones!: Table<TombstoneRow, string>;

  constructor() {
    super('disher');

    // v1-v3: legacy schema with sync columns. Replaced wholesale in v4 — the
    // upgrade clears every store. Snapshot pull on next BackupGate mount
    // re-hydrates from the server vault, so this is non-destructive for users
    // whose data is already up there.
    this.version(1).stores({
      products: 'id, user_id, [user_id+_dirty]',
      dishes: 'id, user_id, [user_id+_dirty]',
      dish_items: 'id, user_id, dish_id, product_id, [user_id+_dirty]',
      dish_portions: 'id, user_id, dish_id, [user_id+_dirty]',
      schedule_foods: 'id, user_id, [user_id+date], [user_id+_dirty]',
      schedule_events: 'id, user_id, [user_id+date], [user_id+_dirty]',
      daily_norms: 'id, user_id, [user_id+_dirty]',
      periods: 'id, user_id, [user_id+_dirty]',
    });
    this.version(2).stores({
      analyses: 'id, user_id, [user_id+_dirty], experiment_id, [user_id+kind]',
      experiments: 'id, user_id, [user_id+_dirty], [user_id+ended_at]',
    });
    this.version(3).stores({
      analyses: 'id, user_id, [user_id+_dirty], [user_id+status]',
      experiments: null,
      hypotheses: 'id, user_id, [user_id+_dirty], [user_id+started_at], [user_id+ended_at]',
    });

    // v4 (2026-05-09): zero-base rewrite. Drop sync columns, drop user_id,
    // drop the analyses Dexie table (analyses live in pg only now). Indexes
    // serve queries, not sync collectors.
    this.version(4)
      .stores({
        products: 'id',
        dishes: 'id',
        dish_items: 'id, dish_id',
        dish_portions: 'id, dish_id',
        schedule_foods: 'id, date',
        schedule_events: 'id, date',
        daily_norms: 'id',
        periods: 'id',
        analyses: null,
        hypotheses: 'id, started_at',
      })
      .upgrade((tx) => Promise.all(tx.storeNames.map((n) => tx.table(n).clear())));

    // v5 (2026-05-12): add custom_tags. Existing stores are unchanged — Dexie
    // keeps prior data, just opens the new objectStore. Index on product_id so
    // useCustomTagsByProduct can do an indexed lookup instead of full scan.
    this.version(5).stores({
      custom_tags: 'id, product_id',
    });

    // v6 (2026-05-15): hypothesis simplification. Drop the lifecycle columns
    // (days, started_at, ended_at, outcome, source_analysis_id, note,
    // saved_at) from existing rows and drop the started_at index — a
    // hypothesis is now just {id, title, body, created_at}. On a fresh device
    // the modify() runs over an empty table (no-op). The list now sorts by
    // created_at instead of saved_at.
    // See apps/food-calc/tds/home-and-analyses-ui.md.
    this.version(6)
      .stores({
        hypotheses: 'id',
      })
      .upgrade((tx) =>
        tx
          .table('hypotheses')
          .toCollection()
          .modify((row: Record<string, unknown>) =>
            stripLegacyHypothesisFields(row),
          ),
      );

    // v7 (2026-05-30): merge-sync foundation. Backfill `updated_at = created_at`
    // on every existing row across the 9 domain tables — `updated_at` is the
    // per-row LWW key the sync merge() compares (see the merge-sync fix plan).
    // The backfill is non-destructive and idempotent: it only fills the field
    // when absent, so a re-run (or a row already carrying updated_at) is a
    // no-op. On a fresh device every table is empty and modify() never fires.
    // Also create the `tombstones` store (hard-delete bookkeeping read by
    // merge()) and drop the residual `periods` store (no entity, no writers).
    this.version(7)
      .stores({
        periods: null,
        tombstones: 'id, table',
      })
      .upgrade((tx) =>
        Promise.all(
          [
            'products',
            'dishes',
            'dish_items',
            'dish_portions',
            'schedule_foods',
            'schedule_events',
            'daily_norms',
            'hypotheses',
            'custom_tags',
          ].map((name) =>
            tx
              .table(name)
              .toCollection()
              .modify((row: Record<string, unknown>) => {
                if (row.updated_at === undefined) row.updated_at = row.created_at;
              }),
          ),
        ),
      );

    // v8 (2026-06-14): add the `insights` store — insights saved from analysis
    // results («Сохранить»), the read-only sibling of hypotheses. Keyed
    // by id, sorted by created_at in memory (same idiom as hypotheses). Existing
    // stores are untouched; Dexie just opens the new objectStore. It joins
    // DOMAIN_TABLES so it LWW-merges and rides the backup snapshot.
    this.version(8).stores({
      insights: 'id',
    });
  }
}

export const db = new DisherDB();
