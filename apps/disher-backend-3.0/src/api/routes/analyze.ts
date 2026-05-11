import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { pool } from "../db.js";
import { requireUser } from "../../auth/require-user.js";
import {
  runAnalysisJob,
  updateAnalysisFailed,
  type AnalyzePayload,
  type CallLLM,
  type HypothesisContext,
} from "./analyze.runJob.js";
import type { AnalysisMode } from "../../shared/analysis-output.js";

// POST /api/analyze         — kick off an analysis. Idempotent on `id`.
// GET  /api/analyses/:id    — poll an analysis row. State is derived from
//                              result_md (empty = pending, anything else =
//                              done; failure rows start with "⚠️").
//
// No status enum, no client_uuid (the row id IS the idempotency key), no
// stale-pending sweep. A job that never finishes stays pending forever; the
// user starts a fresh analysis with a new id.
//
// See apps/food-calc/tds/ANALYSIS/zero-base-rewrite-2026-05-09.md §Server route.

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AnalyzeBody = {
  id?: string;
  windowStart?: string;
  windowEnd?: string;
  payload?: {
    scheduleFoods?: unknown[];
    scheduleEvents?: unknown[];
    hypotheses?: HypothesisContext[];
    mode?: AnalysisMode;
  };
};

function parseMode(value: unknown): AnalysisMode {
  return value === "foods-only" ? "foods-only" : "foods-and-events";
}

type AnalysisRow = {
  id: string;
  user_id: string;
  window_start: Date;
  window_end: Date;
  result_md: string;
  idea_cards: unknown;
  created_at: Date;
};

type AnalyzeRouteOptions = {
  /** Test-only — replace fetchLLMOnce with a stub. */
  callLLM?: CallLLM;
};

function serialiseRow(row: AnalysisRow) {
  return {
    id: row.id,
    user_id: row.user_id,
    window_start: row.window_start.toISOString(),
    window_end: row.window_end.toISOString(),
    result_md: row.result_md,
    idea_cards: row.idea_cards,
    created_at: row.created_at.toISOString(),
  };
}

export async function analyzeRoutes(
  app: FastifyInstance,
  opts: AnalyzeRouteOptions = {},
) {
  app.addHook("preHandler", requireUser);

  app.post("/analyze", async (req: FastifyRequest, reply: FastifyReply) => {
    if (!pool) return reply.status(500).send({ error: "DB not configured" });

    const body = (req.body ?? {}) as AnalyzeBody;
    const id = typeof body.id === "string" ? body.id : "";
    if (!UUID_RE.test(id)) {
      return reply.status(400).send({ error: "id must be a UUID" });
    }
    const start = body.windowStart;
    const end = body.windowEnd;
    if (typeof start !== "string" || typeof end !== "string") {
      return reply
        .status(400)
        .send({ error: "windowStart/windowEnd required" });
    }

    const mode = parseMode(body.payload?.mode);
    const payload: AnalyzePayload = {
      windowStart: start,
      windowEnd: end,
      scheduleFoods: Array.isArray(body.payload?.scheduleFoods)
        ? body.payload!.scheduleFoods!
        : [],
      scheduleEvents:
        mode === "foods-only"
          ? []
          : Array.isArray(body.payload?.scheduleEvents)
            ? body.payload!.scheduleEvents!
            : [],
      ...(Array.isArray(body.payload?.hypotheses)
        ? { hypotheses: body.payload!.hypotheses! }
        : {}),
      mode,
    };

    // INSERT pending row. The row id IS the idempotency key — a duplicate POST
    // hits the conflict path and returns the existing row without re-firing
    // the LLM.
    const insert = await pool.query<AnalysisRow>(
      `insert into public.analyses (id, user_id, window_start, window_end)
       values ($1::uuid, $2::uuid, $3::timestamptz, $4::timestamptz)
       on conflict (id) do nothing
       returning *`,
      [id, req.userId, start, end],
    );

    if ((insert.rowCount ?? 0) > 0) {
      const row = insert.rows[0];
      void runAnalysisJob(row.id, payload, opts.callLLM).catch((err) =>
        updateAnalysisFailed(row.id, err),
      );
      return reply.send({ analysis: serialiseRow(row) });
    }

    // Conflict path. Confirm ownership and return current state.
    const existing = await pool.query<AnalysisRow>(
      `select * from public.analyses where id = $1::uuid and user_id = $2::uuid`,
      [id, req.userId],
    );
    const row = existing.rows[0];
    if (!row) return reply.status(404).send({ error: "analysis not found" });
    return reply.send({ analysis: serialiseRow(row) });
  });

  app.get<{ Params: { id: string } }>("/analyses/:id", async (req, reply) => {
    if (!pool) return reply.status(500).send({ error: "DB not configured" });
    const id = req.params.id;
    if (!UUID_RE.test(id))
      return reply.status(404).send({ error: "not found" });
    const result = await pool.query<AnalysisRow>(
      `select * from public.analyses
       where id = $1::uuid and user_id = $2::uuid`,
      [id, req.userId],
    );
    const row = result.rows[0];
    if (!row) return reply.status(404).send({ error: "not found" });
    return reply.send({ analysis: serialiseRow(row) });
  });
}
