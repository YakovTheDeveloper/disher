import { column, Schema, Table } from '@powersync/web';

// PowerSync only supports TEXT, INTEGER, REAL at the SQLite layer.
// Postgres-side types are mapped here:
//   uuid, text, timestamptz, date, jsonb, enum -> TEXT
//   numeric                                    -> REAL
//   int                                        -> INTEGER
//
// `id` is implicit on every Table (TEXT primary key) — do not redeclare it.
// jsonb columns arrive on the client as serialized strings; parse on read,
// stringify on write inside the entity layer.

const products = new Table(
  {
    user_id: column.text,
    name: column.text,
    name_eng: column.text,
    description: column.text,
    description_eng: column.text,
    source: column.text,
    price_per_kg: column.real,
    nutrients: column.text,
    portions: column.text,
    categories: column.text,
    created_at: column.text,
    updated_at: column.text,
    deleted_at: column.text,
  },
  { indexes: { user_id: ['user_id'] } }
);

const dishes = new Table(
  {
    user_id: column.text,
    name: column.text,
    created_at: column.text,
    updated_at: column.text,
    deleted_at: column.text,
  },
  { indexes: { user_id: ['user_id'] } }
);

const dish_items = new Table(
  {
    user_id: column.text,
    dish_id: column.text,
    product_id: column.text,
    quantity: column.real,
    created_at: column.text,
    updated_at: column.text,
    deleted_at: column.text,
  },
  { indexes: { dish_id: ['dish_id'], user_id: ['user_id'] } }
);

const dish_portions = new Table(
  {
    user_id: column.text,
    dish_id: column.text,
    label: column.text,
    amount: column.real,
    unit: column.text,
    grams: column.real,
    created_at: column.text,
    updated_at: column.text,
    deleted_at: column.text,
  },
  { indexes: { dish_id: ['dish_id'], user_id: ['user_id'] } }
);

const schedule_foods = new Table(
  {
    user_id: column.text,
    date: column.text,
    time: column.text,
    type: column.text, // enum: 'food' | 'dish'
    quantity: column.real,
    details: column.text,
    product_id: column.text,
    dish_id: column.text,
    created_at: column.text,
    updated_at: column.text,
    deleted_at: column.text,
  },
  { indexes: { user_date: ['user_id', 'date'] } }
);

const schedule_events = new Table(
  {
    user_id: column.text,
    date: column.text,
    time: column.text,
    end_time: column.text,
    text: column.text,
    atoms: column.text, // jsonb on server
    created_at: column.text,
    updated_at: column.text,
    deleted_at: column.text,
  },
  { indexes: { user_date: ['user_id', 'date'] } }
);

const daily_norms = new Table(
  {
    user_id: column.text,
    name: column.text,
    description: column.text,
    items: column.text, // jsonb on server
    created_at: column.text,
    updated_at: column.text,
    deleted_at: column.text,
  },
  { indexes: { user_id: ['user_id'] } }
);

const periods = new Table(
  {
    user_id: column.text,
    name: column.text,
    color_index: column.integer,
    font_family: column.text,
    font_size: column.integer,
    created_at: column.text,
    updated_at: column.text,
    deleted_at: column.text,
  },
  { indexes: { user_id: ['user_id'] } }
);

export const AppSchema = new Schema({
  products,
  dishes,
  dish_items,
  dish_portions,
  schedule_foods,
  schedule_events,
  daily_norms,
  periods,
});

export type AppDatabase = (typeof AppSchema)['types'];
export type ProductRow = AppDatabase['products'];
export type DishRow = AppDatabase['dishes'];
export type DishItemRow = AppDatabase['dish_items'];
export type DishPortionRow = AppDatabase['dish_portions'];
export type ScheduleFoodRow = AppDatabase['schedule_foods'];
export type ScheduleEventRow = AppDatabase['schedule_events'];
export type DailyNormRow = AppDatabase['daily_norms'];
export type PeriodRow = AppDatabase['periods'];
