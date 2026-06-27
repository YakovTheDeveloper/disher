import type { FastifyInstance } from "fastify";
import { pool } from "../db.js";
import { requireUser } from "../../auth/require-user.js";

// PUT /api/backup — write the user's daily snapshot. Last write wins.
// GET /api/backup — read the user's snapshot, or 404 if none.
// DELETE /api/backup — erase the user's vault (sync turned off / consent withdrawn).
//
// The body is opaque jsonb. The server has no schema for user data — the
// client dumps every Dexie table and applies the same blob on a fresh device.
// See apps/food-calc/tds/ANALYSIS/zero-base-rewrite-2026-05-09.md.

export async function backupRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireUser);

  app.put("/", async (req, reply) => {
    if (!pool) return reply.status(500).send({ error: "DB not configured" });
    await pool.query(
      `insert into public.user_backups (user_id, snapshot)
       values ($1::uuid, $2::jsonb)
       on conflict (user_id) do update set snapshot = excluded.snapshot`,
      [req.userId, req.body],
    );
    return reply.code(204).send();
  });

  app.get("/", async (req, reply) => {
    if (!pool) return reply.status(500).send({ error: "DB not configured" });
    const r = await pool.query<{ snapshot: unknown }>(
      `select snapshot from public.user_backups where user_id = $1::uuid`,
      [req.userId],
    );
    if (!r.rowCount) return reply.code(404).send();
    return reply.send(r.rows[0].snapshot);
  });

  // DELETE /api/backup — erase the user's vault when they withdraw consent to
  // server storage (sync switched off). The local Dexie copy is the source of
  // truth and is untouched; re-enabling sync re-pushes it. Idempotent: 204
  // whether or not a row existed.
  app.delete("/", async (req, reply) => {
    if (!pool) return reply.status(500).send({ error: "DB not configured" });
    await pool.query(
      `delete from public.user_backups where user_id = $1::uuid`,
      [req.userId],
    );
    return reply.code(204).send();
  });
}
