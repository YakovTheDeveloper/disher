import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import pg from "pg";

// 8.1 Schema-conformance test (P0).
//
// The 30 Apr 500 was a live-DB column drift: backend SQL referenced LWW columns
// (`client_modified_at`, `edit_count`, ...) that were not present on every table
// in the deployed Supabase. This test reads `information_schema.columns` and
// asserts the live DB is a SUPERSET of what `backup.ts` writes. It does NOT
// pin equality — migrations may add columns later without breaking backend.
//
// Truth source: TABLES spec in src/api/routes/backup.ts (domain) plus the
// allCols injected inside applyBackupBatch (LWW meta + id + created_at +
// deleted_at + server_received_at).
//
// Required env: SUPABASE_DB_URL (Session Pooler URL). If absent the test is
// skipped with a clear message — CI without secrets stays green.

type ExpectedColumn = {
  /** SQL column name. */
  name: string;
  /** Postgres data_type (information_schema). udt_name used for enums. */
  dataType: string;
  /** udt_name (e.g. "schedule_food_type" for enums, "uuid" for uuid). Optional. */
  udtName?: string;
};

const UUID: ExpectedColumn[] = [{ name: "id", dataType: "uuid" }];

// LWW + audit columns shared by every user-table. Mirrors allCols inside
// applyBackupBatch in backup.ts.
const LWW_META: ExpectedColumn[] = [
  { name: "client_modified_at", dataType: "timestamp with time zone" },
  { name: "edit_count", dataType: "integer" },
  { name: "server_received_at", dataType: "timestamp with time zone" },
  { name: "created_at", dataType: "timestamp with time zone" },
  { name: "deleted_at", dataType: "timestamp with time zone" },
];

const EXPECTED_COLUMNS: Record<string, ExpectedColumn[]> = {
  products: [
    ...UUID,
    { name: "user_id", dataType: "uuid" },
    { name: "name", dataType: "text" },
    { name: "name_eng", dataType: "text" },
    { name: "description", dataType: "text" },
    { name: "description_eng", dataType: "text" },
    { name: "source", dataType: "text" },
    { name: "price_per_kg", dataType: "numeric" },
    { name: "nutrients", dataType: "jsonb" },
    { name: "portions", dataType: "jsonb" },
    { name: "categories", dataType: "jsonb" },
    ...LWW_META,
  ],
  dishes: [
    ...UUID,
    { name: "user_id", dataType: "uuid" },
    { name: "name", dataType: "text" },
    ...LWW_META,
  ],
  dish_items: [
    ...UUID,
    { name: "user_id", dataType: "uuid" },
    { name: "dish_id", dataType: "uuid" },
    { name: "product_id", dataType: "uuid" },
    { name: "quantity", dataType: "numeric" },
    ...LWW_META,
  ],
  dish_portions: [
    ...UUID,
    { name: "user_id", dataType: "uuid" },
    { name: "dish_id", dataType: "uuid" },
    { name: "label", dataType: "text" },
    { name: "amount", dataType: "numeric" },
    { name: "unit", dataType: "text" },
    { name: "grams", dataType: "numeric" },
    ...LWW_META,
  ],
  schedule_foods: [
    ...UUID,
    { name: "user_id", dataType: "uuid" },
    { name: "date", dataType: "text" },
    { name: "time", dataType: "text" },
    {
      name: "type",
      dataType: "USER-DEFINED",
      udtName: "schedule_food_type",
    },
    { name: "quantity", dataType: "numeric" },
    { name: "details", dataType: "text" },
    { name: "product_id", dataType: "uuid" },
    { name: "dish_id", dataType: "uuid" },
    ...LWW_META,
  ],
  schedule_events: [
    ...UUID,
    { name: "user_id", dataType: "uuid" },
    { name: "date", dataType: "text" },
    { name: "time", dataType: "text" },
    { name: "end_time", dataType: "text" },
    { name: "text", dataType: "text" },
    { name: "atoms", dataType: "jsonb" },
    ...LWW_META,
  ],
  daily_norms: [
    ...UUID,
    { name: "user_id", dataType: "uuid" },
    { name: "name", dataType: "text" },
    { name: "description", dataType: "text" },
    { name: "items", dataType: "jsonb" },
    ...LWW_META,
  ],
  periods: [
    ...UUID,
    { name: "user_id", dataType: "uuid" },
    { name: "name", dataType: "text" },
    { name: "color_index", dataType: "integer" },
    { name: "font_family", dataType: "text" },
    { name: "font_size", dataType: "integer" },
    ...LWW_META,
  ],
};

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

const describeIfDb = SUPABASE_DB_URL ? describe : describe.skip;

describeIfDb("backup schema conformance (live DB)", () => {
  const pool = new pg.Pool({
    connectionString: SUPABASE_DB_URL,
    max: 2,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
  });

  afterAll(async () => {
    await pool.end();
  });

  it.each(Object.entries(EXPECTED_COLUMNS))(
    "table public.%s has every column backup.ts writes",
    async (table, expected) => {
      const { rows } = await pool.query<{
        column_name: string;
        data_type: string;
        udt_name: string;
      }>(
        `select column_name, data_type, udt_name
         from information_schema.columns
         where table_schema = 'public' and table_name = $1`,
        [table],
      );

      expect(
        rows.length,
        `table public.${table} not found in information_schema (or no columns) — did the initial migration run?`,
      ).toBeGreaterThan(0);

      const actual = new Map(
        rows.map((r) => [
          r.column_name,
          { dataType: r.data_type, udtName: r.udt_name },
        ]),
      );

      const missing: string[] = [];
      const wrongType: string[] = [];
      for (const col of expected) {
        const got = actual.get(col.name);
        if (!got) {
          missing.push(col.name);
          continue;
        }
        if (got.dataType !== col.dataType) {
          wrongType.push(
            `${col.name}: expected ${col.dataType}, got ${got.dataType}`,
          );
          continue;
        }
        if (col.udtName && got.udtName !== col.udtName) {
          wrongType.push(
            `${col.name}: expected udt_name=${col.udtName}, got ${got.udtName}`,
          );
        }
      }

      expect(missing, `public.${table}: missing columns`).toEqual([]);
      expect(wrongType, `public.${table}: column type mismatch`).toEqual([]);
    },
  );

  it("enum schedule_food_type exists with values food, dish", async () => {
    const { rows } = await pool.query<{ enumlabel: string }>(
      `select e.enumlabel
       from pg_type t
       join pg_enum e on e.enumtypid = t.oid
       where t.typname = 'schedule_food_type'
       order by e.enumsortorder`,
    );
    const labels = rows.map((r) => r.enumlabel);
    expect(
      labels,
      "enum schedule_food_type missing or wrong labels",
    ).toEqual(["food", "dish"]);
  });
});

if (!SUPABASE_DB_URL) {
  // Use describe.skip already; this extra test surfaces the reason in the
  // reporter so a green run on a fresh machine doesn't silently mean "no DB".
  describe("backup schema conformance (live DB)", () => {
    it.skip(
      "SUPABASE_DB_URL not set — set it in apps/disher-backend-3.0/.env to run this test",
      () => {},
    );
  });
}
