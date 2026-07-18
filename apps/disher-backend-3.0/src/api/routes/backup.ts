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

// The snapshot's CONTENTS must stay unconstrained — the server has no schema for
// user data by design; the client dumps its Dexie tables and applies the blob
// verbatim on a fresh device, so naming any table here would date the contract.
//
// `additionalProperties: true` is what makes that safe, and it is load-bearing:
// Fastify's Ajv runs `removeAdditional: true`, which DELETES unlisted members —
// but only under `additionalProperties: false`, which a bare Type.Object emits
// nowhere. Spelled this way Ajv passes the diary through untouched, unnamed
// tables and all (verified by probe), while the spec gets to say "a JSON object"
// instead of "literally anything" — and a bare string or array in the body is
// refused instead of being stored as the user's whole vault.
const SNAPSHOT_SCHEMA = Type.Object(
  {},
  {
    additionalProperties: true,
    title: "BackupSnapshot",
    description:
      "Opaque client snapshot (every Dexie table). The server stores it as jsonb and never inspects it.",
  },
);

export async function backupRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireUser);

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
      // `received_at` must be re-stamped on the UPDATE branch too: the column
      // default only fires on INSERT, so without this it would freeze at the
      // very first push and record nothing thereafter. It exists to keep a
      // wrong-clock offset recoverable (row claims 2036, arrived 2026 ⇒ ~10y
      // fast) — see db/migrations/20260716120000_backup_received_at.sql.
      await pool.query(
        `insert into public.user_backups (user_id, snapshot)
         values ($1::uuid, $2::jsonb)
         on conflict (user_id) do update set
           snapshot    = excluded.snapshot,
           received_at = now()`,
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
