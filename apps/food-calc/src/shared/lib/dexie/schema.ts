import Dexie, { type Table } from 'dexie';

// Disher local Dexie DB — source of truth for the client. Backend Postgres
// is a durability layer that we push to via POST /api/backup. Rows here
// mirror the Postgres column names (snake_case) so push/pull is
// JSON.stringify with no field renaming.
//
// Sync metadata (every user-row table):
//   client_modified_at  ISO string set by the writing-hook on every edit
//   edit_count          counter, +1 per mutation, primary LWW key
//   _dirty              client-only flag (not in Postgres). 1 = needs push.
//                       Cleared by push module after server ACK using a
//                       Notesnook-style timestamp guard:
//                       `_dirty=0 WHERE client_modified_at <= pushTimestamp`.
//                       Indexed so the drain collector is index-bound.
//   deleted_at          tombstone. Soft-delete via `dirty + deleted_at`
//                       update; the row is never removed from Dexie until
//                       the server confirms. Filter `!deleted_at` in queries.

// ─── shared row shape pieces ───────────────────────────────────────────────

interface SyncMeta {
  client_modified_at: string;
  edit_count: number;
  _dirty: 0 | 1;
  deleted_at: string | null;
  created_at: string;
  /** Server-stamped on accept; only used for clock-skew telemetry. */
  server_received_at?: string;
}

// ─── per-table row interfaces (mirror Postgres exactly) ────────────────────

export interface ProductRow extends SyncMeta {
  id: string;
  /** null = global catalog row. */
  user_id: string | null;
  name: string;
  name_eng: string;
  description: string;
  description_eng: string;
  source: string;
  price_per_kg: number;
  /** jsonb — stored as parsed object, not stringified. */
  nutrients: Record<string, unknown>;
  portions: Array<Record<string, unknown>>;
  categories: Array<unknown>;
}

export interface DishRow extends SyncMeta {
  id: string;
  user_id: string;
  name: string;
}

export interface DishItemRow extends SyncMeta {
  id: string;
  user_id: string;
  dish_id: string;
  product_id: string;
  quantity: number;
}

export interface DishPortionRow extends SyncMeta {
  id: string;
  user_id: string;
  dish_id: string;
  label: string;
  amount: number;
  unit: string;
  grams: number;
}

export type ScheduleFoodType = 'food' | 'dish';

export interface ScheduleFoodRow extends SyncMeta {
  id: string;
  user_id: string;
  date: string;
  time: string;
  type: ScheduleFoodType;
  quantity: number;
  details: string;
  product_id: string | null;
  dish_id: string | null;
}

export interface ScheduleEventRow extends SyncMeta {
  id: string;
  user_id: string;
  date: string;
  time: string;
  end_time: string;
  text: string;
  atoms: Array<unknown>;
}

export interface DailyNormRow extends SyncMeta {
  id: string;
  user_id: string;
  name: string;
  description: string;
  items: Record<string, unknown>;
}

export interface PeriodRow extends SyncMeta {
  id: string;
  user_id: string;
  name: string;
  color_index: number;
  font_family: string;
  font_size: number;
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
  periods!:         Table<PeriodRow,         string>;

  constructor() {
    super('disher');

    // Index strategy:
    //   id              primary key (uuid)
    //   user_id         every list-by-user query
    //   [user_id+_dirty]  drain collector — pull dirty rows for one user
    //   [user_id+date]    schedule_foods / schedule_events daily views
    //   [dish_id+...]     fk-bound joins for dish_items / dish_portions
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
  }
}

export const db = new DisherDB();

export const SYNCED_TABLES = [
  'products',
  'dishes',
  'dish_items',
  'dish_portions',
  'schedule_foods',
  'schedule_events',
  'daily_norms',
  'periods',
] as const;

export type SyncedTable = (typeof SYNCED_TABLES)[number];
