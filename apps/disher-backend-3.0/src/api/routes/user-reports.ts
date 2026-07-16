import type { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { randomUUID } from "node:crypto";
import { pool } from "../db.js";
import { requireUser } from "../../auth/require-user.js";

// POST /api/user-reports — the user-facing "Сообщить о проблеме" sink, tied to
// the authenticated user. Text + client metadata only (no screenshot, no disk
// write), so — unlike the dev disk sink at routes/bug-reports.ts — this route is
// SAFE in production and is registered there (see buildApp.ts). Auth-gated: the
// trigger lives inside the settings drawer, which only renders behind AuthGate,
// so a bearer is always present and every report is attributable (no anon spam).

// Guardrail against a pathological paste; the textarea also caps client-side.
const MAX_TEXT = 4000;
const MAX_META = 512;

// Keep short metadata strings bounded; drop empties to null.
function clampMeta(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_META);
}

type UserReportBody = {
  text?: string;
  page?: string;
  screenSize?: string;
  userAgent?: string;
  pwa?: string;
};

// Shape gate for this PROD route (the dev sibling routes/bug-reports.ts stays
// schema-less — it's dev-only). Deliberately NO `minLength`/`maxLength` here:
// an empty/whitespace `text` is caught by the trim check below, and oversized
// text is TRUNCATED (intent), not rejected — a `maxLength` would turn a long
// bug report into a 400 for the user writing it.
const BODY_SCHEMA = Type.Object(
  {
    text: Type.String(),
    page: Type.Optional(Type.String()),
    screenSize: Type.Optional(Type.String()),
    userAgent: Type.Optional(Type.String()),
    pwa: Type.Optional(Type.String()),
  },
  { additionalProperties: false, title: "UserReport" },
);

export async function userReportsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireUser);

  app.post<{ Body: UserReportBody }>(
    "/",
    {
      schema: {
        operationId: "submitUserReport",
        tags: ["feedback"],
        description: "User-facing «Сообщить о проблеме» sink — text + client metadata.",
        security: [{ cookieSession: [] }],
        body: BODY_SCHEMA,
      },
    },
    async (req, reply) => {
      if (!pool) return reply.status(500).send({ error: "DB not configured" });

      const { text, page, screenSize, userAgent, pwa } = req.body ?? {};
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return reply.status(400).send({ error: "text is required" });
      }

      await pool.query(
        `insert into public.user_reports
           (id, user_id, text, page, screen_size, user_agent, pwa)
         values ($1::uuid, $2::uuid, $3, $4, $5, $6, $7)`,
        [
          randomUUID(),
          req.userId,
          text.trim().slice(0, MAX_TEXT),
          clampMeta(page),
          clampMeta(screenSize),
          // Fall back to the request UA header, but keep the fallback INSIDE
          // clampMeta so a crafted oversized header can't bypass the 512 cap.
          clampMeta(userAgent ?? req.headers["user-agent"]),
          clampMeta(pwa),
        ],
      );

      return { ok: true };
    },
  );
}
