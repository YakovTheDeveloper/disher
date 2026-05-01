import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { pool } from "../db.js";
import { requireUser } from "../../auth/require-user.js";

// POST   /api/backup            — push dirty rows from client, LWW upsert.
// GET    /api/backup/snapshot   — full pull for fresh install / eviction recovery.
// GET    /api/backup/stats      — per-table counts for "reset and resync" fail-safe.
//
// Conflict resolution (per backup-polling-implementation-guide-2026.md §4.2):
//   1. Soft-delete sticky: incoming deleted_at set wins over live existing.
//   2. Otherwise edit_count primary, client_modified_at >= tie-breaker
//      (>= so re-sending the exact same row is an accepted no-op — required
//      idempotency invariant).
// Logic lives in TS (matches Notesnook/SN/Joplin prior art); RLS is bypassed
// because backend itself validates row.user_id === jwt.sub before every write.

// ─── per-table column whitelist ────────────────────────────────────────────
// Defines which JSON fields on an incoming row map to which Postgres column,
// in the canonical INSERT order. The table name and these column names are
// the only identifiers we ever interpolate — everything else is parameterised.

type ColumnSpec = {
  /** SQL column name. */
  col: string;
  /** Field name on the incoming JSON row. Defaults to `col`. */
  field?: string;
  /** SQL cast applied to the parameter. e.g. "uuid", "numeric", "jsonb". */
  cast?: string;
  /** Default if the field is absent. Applied AFTER cast. */
  default?: unknown;
};

type TableSpec = {
  /** Domain columns (everything except sync metadata + id). */
  domain: ColumnSpec[];
};

const TABLES: Record<string, TableSpec> = {
  products: {
    domain: [
      { col: "user_id", cast: "uuid" },
      { col: "name", default: "" },
      { col: "name_eng", default: "" },
      { col: "description", default: "" },
      { col: "description_eng", default: "" },
      { col: "source", default: "" },
      { col: "price_per_kg", cast: "numeric", default: 0 },
      { col: "nutrients", cast: "jsonb", default: {} },
      { col: "portions", cast: "jsonb", default: [] },
      { col: "categories", cast: "jsonb", default: [] },
    ],
  },
  dishes: {
    domain: [
      { col: "user_id", cast: "uuid" },
      { col: "name", default: "" },
    ],
  },
  dish_items: {
    domain: [
      { col: "user_id", cast: "uuid" },
      { col: "dish_id", cast: "uuid" },
      { col: "product_id", cast: "uuid" },
      { col: "quantity", cast: "numeric" },
    ],
  },
  dish_portions: {
    domain: [
      { col: "user_id", cast: "uuid" },
      { col: "dish_id", cast: "uuid" },
      { col: "label", default: "" },
      { col: "amount", cast: "numeric" },
      { col: "unit", default: "" },
      { col: "grams", cast: "numeric" },
    ],
  },
  schedule_foods: {
    domain: [
      { col: "user_id", cast: "uuid" },
      { col: "date", default: "" },
      { col: "time", default: "" },
      { col: "type", cast: "schedule_food_type" },
      { col: "quantity", cast: "numeric" },
      { col: "details", default: "" },
      { col: "product_id", cast: "uuid", default: null },
      { col: "dish_id", cast: "uuid", default: null },
    ],
  },
  schedule_events: {
    domain: [
      { col: "user_id", cast: "uuid" },
      { col: "date", default: "" },
      { col: "time", default: "" },
      { col: "end_time", default: "" },
      { col: "text", default: "" },
      { col: "atoms", cast: "jsonb", default: [] },
    ],
  },
  daily_norms: {
    domain: [
      { col: "user_id", cast: "uuid" },
      { col: "name", default: "" },
      { col: "description", default: "" },
      { col: "items", cast: "jsonb", default: {} },
    ],
  },
  periods: {
    domain: [
      { col: "user_id", cast: "uuid" },
      { col: "name", default: "" },
      { col: "color_index", cast: "int", default: 0 },
      { col: "font_family", default: "sans" },
      { col: "font_size", cast: "int", default: 16 },
    ],
  },
};

const TABLE_NAMES = Object.keys(TABLES) as Array<keyof typeof TABLES>;

// ─── types ─────────────────────────────────────────────────────────────────

type IncomingRow = {
  table: string;
  id: string;
  user_id: string;
  edit_count: number;
  client_modified_at: string;
  deleted_at?: string | null;
  created_at?: string;
  [k: string]: unknown;
};

type AcceptedRow = {
  id: string;
  server_edit_count: number;
  server_received_at: string;
};

type RejectedRow = {
  id: string;
  reason: "stale_edit_count" | "user_id_mismatch";
  server_state?: {
    id: string;
    edit_count: number;
    client_modified_at: string;
    deleted_at: string | null;
  };
};

// ─── core LWW upsert ───────────────────────────────────────────────────────

async function applyBackupBatch(
  table: string,
  rows: IncomingRow[],
  authUserId: string,
): Promise<{ accepted: AcceptedRow[]; rejected: RejectedRow[] }> {
  if (!pool) throw new Error("DB pool not initialised");
  if (rows.length === 0) return { accepted: [], rejected: [] };

  const spec = TABLES[table];
  if (!spec) throw new Error(`Unknown table: ${table}`);

  // 1. Reject anything where row.user_id !== authUserId outright. We don't
  // even attempt to write — backend is the single source of trust.
  const rejected: RejectedRow[] = [];
  const eligible: IncomingRow[] = [];
  for (const row of rows) {
    if (row.user_id !== authUserId) {
      rejected.push({ id: row.id, reason: "user_id_mismatch" });
    } else {
      eligible.push(row);
    }
  }
  if (eligible.length === 0) return { accepted: [], rejected };

  // 2. Build one big INSERT ... VALUES (...), (...), ... ON CONFLICT DO UPDATE.
  // Columns: id, ...domain, client_modified_at, edit_count, server_received_at,
  //          created_at, deleted_at
  const allCols = [
    { col: "id", cast: "uuid" },
    ...spec.domain,
    { col: "client_modified_at", cast: "timestamptz" },
    { col: "edit_count", cast: "int" },
    // server_received_at is set with now() in SQL, NOT a parameter.
    { col: "created_at", cast: "timestamptz" },
    { col: "deleted_at", cast: "timestamptz", default: null },
  ];

  const params: unknown[] = [];
  const valueRows: string[] = [];

  for (const row of eligible) {
    const placeholders: string[] = [];
    for (const c of allCols) {
      const field = (c as ColumnSpec).field ?? c.col;
      let val: unknown = row[field];
      if (val === undefined) {
        val = (c as ColumnSpec).default ?? null;
      }
      // Empty string for nullable uuid/timestamp -> null.
      if (val === "" && (c.cast === "uuid" || c.cast === "timestamptz")) {
        val = null;
      }
      // jsonb: pg expects a JSON string when casting.
      if (c.cast === "jsonb" && val !== null && typeof val !== "string") {
        val = JSON.stringify(val);
      }
      params.push(val);
      const ph = `$${params.length}`;
      placeholders.push(c.cast ? `${ph}::${c.cast}` : ph);
    }
    // Inject now() for server_received_at at the right position.
    // allCols order is: id, ...domain, client_modified_at, edit_count,
    //                   created_at, deleted_at — server_received_at is appended.
    valueRows.push(`(${placeholders.join(", ")}, now())`);
  }

  const colList =
    allCols.map((c) => c.col).join(", ") + ", server_received_at";

  // UPDATE SET — every column except id gets bumped to EXCLUDED.*; server_received_at = now().
  const updateSet = [
    ...spec.domain.map((c) => `${c.col} = excluded.${c.col}`),
    "client_modified_at = excluded.client_modified_at",
    "edit_count = excluded.edit_count",
    "deleted_at = excluded.deleted_at",
    "server_received_at = now()",
  ].join(", ");

  // LWW WHERE.
  const whereLww = `
    (excluded.deleted_at is not null and ${table}.deleted_at is null)
    or (
      ${table}.deleted_at is null and excluded.deleted_at is null
      and (
        excluded.edit_count > ${table}.edit_count
        or (excluded.edit_count = ${table}.edit_count
            and excluded.client_modified_at >= ${table}.client_modified_at)
      )
    )
  `;

  const sql = `
    insert into public.${table} (${colList})
    values ${valueRows.join(", ")}
    on conflict (id) do update
      set ${updateSet}
      where ${whereLww}
    returning id, edit_count, server_received_at
  `;

  const result = await pool.query<{
    id: string;
    edit_count: number;
    server_received_at: Date;
  }>(sql, params);

  const acceptedIds = new Set(result.rows.map((r) => r.id));
  const accepted: AcceptedRow[] = result.rows.map((r) => ({
    id: r.id,
    server_edit_count: r.edit_count,
    server_received_at: r.server_received_at.toISOString(),
  }));

  // 3. Anything in `eligible` that didn't come back from RETURNING lost the
  // LWW comparison. Fetch their current state for client reconciliation.
  const staleIds = eligible
    .filter((r) => !acceptedIds.has(r.id))
    .map((r) => r.id);

  if (staleIds.length > 0) {
    const staleResult = await pool.query<{
      id: string;
      edit_count: number;
      client_modified_at: Date;
      deleted_at: Date | null;
    }>(
      `select id, edit_count, client_modified_at, deleted_at
       from public.${table}
       where id = any($1::uuid[]) and user_id = $2::uuid`,
      [staleIds, authUserId],
    );

    for (const r of staleResult.rows) {
      rejected.push({
        id: r.id,
        reason: "stale_edit_count",
        server_state: {
          id: r.id,
          edit_count: r.edit_count,
          client_modified_at: r.client_modified_at.toISOString(),
          deleted_at: r.deleted_at?.toISOString() ?? null,
        },
      });
    }
  }

  return { accepted, rejected };
}

// ─── POST /api/backup ──────────────────────────────────────────────────────

type BackupBody = {
  rows?: IncomingRow[];
};

async function handlePush(req: FastifyRequest, reply: FastifyReply) {
  if (!pool) {
    return reply.status(500).send({ error: "DB not configured" });
  }

  const userId = req.userId;

  const body = req.body as BackupBody;
  const rows = Array.isArray(body?.rows) ? body.rows : [];

  // Group by table.
  const byTable = new Map<string, IncomingRow[]>();
  for (const row of rows) {
    if (typeof row?.table !== "string" || !TABLES[row.table]) {
      // Unknown table — silently drop. Schema-mismatch handling lives at the
      // X-Disher-Schema-Version layer (not implemented yet, plan §2.3 case 7).
      continue;
    }
    const list = byTable.get(row.table) ?? [];
    list.push(row);
    byTable.set(row.table, list);
  }

  const accepted: Array<AcceptedRow & { table: string }> = [];
  const rejected: Array<RejectedRow & { table: string }> = [];

  for (const [table, tableRows] of byTable) {
    try {
      const r = await applyBackupBatch(table, tableRows, userId);
      for (const a of r.accepted) accepted.push({ ...a, table });
      for (const x of r.rejected) rejected.push({ ...x, table });
    } catch (err) {
      req.log.error({ err, table }, "applyBackupBatch failed");
      return reply.status(500).send({ error: "Backup batch failed" });
    }
  }

  return reply.send({ accepted, rejected });
}

// ─── GET /api/backup/snapshot ──────────────────────────────────────────────

async function handleSnapshot(req: FastifyRequest, reply: FastifyReply) {
  if (!pool) {
    return reply.status(500).send({ error: "DB not configured" });
  }

  const userId = req.userId;

  const out: Record<string, unknown[]> = {};

  for (const table of TABLE_NAMES) {
    // products is the only table with global_catalog rows (user_id IS NULL).
    const where =
      table === "products"
        ? "user_id = $1::uuid or user_id is null"
        : "user_id = $1::uuid";
    const result = await pool.query(
      `select * from public.${table} where ${where}`,
      [userId],
    );
    out[table] = result.rows;
  }

  return reply.send(out);
}

// ─── GET /api/backup/stats ─────────────────────────────────────────────────

async function handleStats(req: FastifyRequest, reply: FastifyReply) {
  if (!pool) {
    return reply.status(500).send({ error: "DB not configured" });
  }

  const userId = req.userId;

  const out: Record<string, number> = {};
  for (const table of TABLE_NAMES) {
    const result = await pool.query<{ count: string }>(
      `select count(*)::text as count from public.${table}
       where user_id = $1::uuid and deleted_at is null`,
      [userId],
    );
    out[table] = Number(result.rows[0]?.count ?? 0);
  }
  return reply.send(out);
}

// ─── route registration ────────────────────────────────────────────────────

export async function backupRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireUser);
  app.post("/", handlePush);
  app.get("/snapshot", handleSnapshot);
  app.get("/stats", handleStats);
}
