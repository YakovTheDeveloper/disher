import type { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { pool } from "../db.js";
import { requireUser } from "../../auth/require-user.js";

// PUT /api/backup — write the user's daily snapshot. Last write wins.
// GET /api/backup — read the user's snapshot, or 404 if none.
// DELETE /api/backup — erase the user's vault (sync turned off / consent withdrawn).
//
// The body is opaque jsonb. The server has no schema for user data — the
// client dumps every Dexie table and applies the same blob on a fresh device.

// The snapshot must stay UNCONSTRAINED, and `Type.Unknown()` (an empty schema)
// is the only spelling that guarantees it: anything with `properties` +
// `additionalProperties: false` would make Fastify's Ajv (removeAdditional is
// on by default) silently DELETE every table the schema failed to name, and
// this body is the user's whole diary. The server has no schema for user data
// by design — the client dumps its Dexie tables and applies the blob verbatim
// on a fresh device.
const SNAPSHOT_SCHEMA = Type.Unknown({
  title: "BackupSnapshot",
  description:
    "Opaque client snapshot (every Dexie table). The server stores it as jsonb and never inspects it.",
});

export async function backupRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireUser);

  app.put(
    "/",
    {
      schema: {
        operationId: "putBackup",
        tags: ["backup"],
        description: "Write the user's snapshot. Last write wins.",
        security: [{ cookieSession: [] }],
        body: SNAPSHOT_SCHEMA,
      },
    },
    async (req, reply) => {
      if (!pool) return reply.status(500).send({ error: "DB not configured" });
      await pool.query(
        `insert into public.user_backups (user_id, snapshot)
         values ($1::uuid, $2::jsonb)
         on conflict (user_id) do update set snapshot = excluded.snapshot`,
        [req.userId, req.body],
      );
      return reply.code(204).send();
    },
  );

  app.get(
    "/",
    {
      schema: {
        operationId: "getBackup",
        tags: ["backup"],
        description: "Read the user's snapshot, or 404 when none exists.",
        security: [{ cookieSession: [] }],
      },
    },
    async (req, reply) => {
      if (!pool) return reply.status(500).send({ error: "DB not configured" });
      const r = await pool.query<{ snapshot: unknown }>(
        `select snapshot from public.user_backups where user_id = $1::uuid`,
        [req.userId],
      );
      if (!r.rowCount) return reply.code(404).send();
      return reply.send(r.rows[0].snapshot);
    },
  );

  // DELETE /api/backup — erase the user's vault when they withdraw consent to
  // server storage (sync switched off). The local Dexie copy is the source of
  // truth and is untouched; re-enabling sync re-pushes it. Idempotent: 204
  // whether or not a row existed.
  app.delete(
    "/",
    {
      schema: {
        operationId: "deleteBackup",
        tags: ["backup"],
        description: "Erase the user's server-side vault. Idempotent — 204 either way.",
        security: [{ cookieSession: [] }],
      },
    },
    async (req, reply) => {
      if (!pool) return reply.status(500).send({ error: "DB not configured" });
      await pool.query(
        `delete from public.user_backups where user_id = $1::uuid`,
        [req.userId],
      );
      return reply.code(204).send();
    },
  );
}
