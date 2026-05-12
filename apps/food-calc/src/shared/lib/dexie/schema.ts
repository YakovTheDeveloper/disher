import Dexie, { type Table } from 'dexie';

// Disher local Dexie DB. The user is the only writer; rows are dumped daily
// as a single JSON blob to /api/backup. There is no sync metadata, no
// soft-delete, no user_id discriminator — sign-out wipes the DB instead.
//
// See apps/food-calc/tds/ANALYSIS/zero-base-rewrite-2026-05-09.md.

// ─── per-table row interfaces ──────────────────────────────────────────────
//
// `created_at` is the only timestamp on every row. `id` is a uuid stamped at
// mutation time. Everything else is domain.

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
  created_at: string;
}

export interface DishRow {
  id: string;
  name: string;
  created_at: string;
}

export interface DishItemRow {
  id: string;
  dish_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
}

export interface DishPortionRow {
  id: string;
  dish_id: string;
  label: string;
  grams: number;
  created_at: string;
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
}

export interface ScheduleEventRow {
  id: string;
  date: string;
  time: string;
  end_time: string;
  text: string;
  atoms: Array<unknown>;
  created_at: string;
}

export interface DailyNormRow {
  id: string;
  name: string;
  description: string;
  items: Record<string, unknown>;
  created_at: string;
}

export interface HypothesisRow {
  id: string;
  title: string;
  body: string;
  days: number | null;
  source_analysis_id: string | null;
  saved_at: string;
  /** Set when the user clicks "Тестирую сейчас". */
  started_at: string | null;
  ended_at: string | null;
  outcome: string | null;
  note: string | null;
  created_at: string;
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
}

// ─── DB ────────────────────────────────────────────────────────────────────

export class DisherDB extends Dexie {
  products!:        Table<ProductRow,        string>;
  dishes!:          Table<DishRow,           string>;
  dish_items!:      Table<DishItemRow,       string>;
  dish_portions!:   Table<DishPortionRow,    string>;
  schedule_foods!:  Table<ScheduleFoodRow,   string>;
  schedule_events!: Table<ScheduleEventRow,  string>;
  daily_norms!:     Table<DailyNormRow,      string>;
  hypotheses!:      Table<HypothesisRow,     string>;
  custom_tags!:     Table<CustomTagRow,      string>;

  constructor() {
    super('disher');

    // v1-v3: legacy schema with sync columns. Replaced wholesale in v4 — the
    // upgrade clears every store. Snapshot pull on next BackupGate mount
    // re-hydrates from the server vault, so this is non-destructive for users
    // whose data is already up there.
    this.version(1).stores({
      products:        'id, user_id, [user_id+_dirty]',
      dishes:          'id, user_id, [user_id+_dirty]',
      dish_items:      'id, user_id, dish_id, product_id, [user_id+_dirty]',
      dish_portions:   'id, user_id, dish_id, [user_id+_dirty]',
      schedule_foods:  'id, user_id, [user_id+date], [user_id+_dirty]',
      schedule_events: 'id, user_id, [user_id+date], [user_id+_dirty]',
      daily_norms:     'id, user_id, [user_id+_dirty]',
      periods:         'id, user_id, [user_id+_dirty]',
    });
    this.version(2).stores({
      analyses:    'id, user_id, [user_id+_dirty], experiment_id, [user_id+kind]',
      experiments: 'id, user_id, [user_id+_dirty], [user_id+ended_at]',
    });
    this.version(3).stores({
      analyses:    'id, user_id, [user_id+_dirty], [user_id+status]',
      experiments: null,
      hypotheses:  'id, user_id, [user_id+_dirty], [user_id+started_at], [user_id+ended_at]',
    });

    // v4 (2026-05-09): zero-base rewrite. Drop sync columns, drop user_id,
    // drop the analyses Dexie table (analyses live in pg only now). Indexes
    // serve queries, not sync collectors.
    this.version(4)
      .stores({
        products:        'id',
        dishes:          'id',
        dish_items:      'id, dish_id',
        dish_portions:   'id, dish_id',
        schedule_foods:  'id, date',
        schedule_events: 'id, date',
        daily_norms:     'id',
        periods:         'id',
        analyses:        null,
        hypotheses:      'id, started_at',
      })
      .upgrade((tx) => Promise.all(tx.storeNames.map((n) => tx.table(n).clear())));

    // v5 (2026-05-12): add custom_tags. Existing stores are unchanged — Dexie
    // keeps prior data, just opens the new objectStore. Index on product_id so
    // useCustomTagsByProduct can do an indexed lookup instead of full scan.
    this.version(5).stores({
      custom_tags: 'id, product_id',
    });
  }
}

export const db = new DisherDB();
