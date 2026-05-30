import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { pool } from "../db.js";
import { requireUser } from "../../auth/require-user.js";
import { asNutrientLines } from "../../shared/analysis-output.js";
import {
  runAnalysisJob,
  updateAnalysisFailed,
  type AnalyzePayload,
  type CallLLM,
  type DayNutrients,
  type HypothesisContext,
} from "./analyze.runJob.js";

// POST /api/analyze         — kick off an analysis. Idempotent on `id`.
// GET  /api/analyses        — list the current user's analyses (pending,
//                              failed and done) for the AnalysesPage list.
// GET  /api/analyses/:id    — poll an analysis row. State is derived from
//                              result_md (empty = pending, anything else =
//                              done; failure rows start with "⚠️").
//
// No status enum, no client_uuid (the row id IS the idempotency key), no
// stale-pending sweep. A job that never finishes stays pending forever; the
// user starts a fresh analysis with a new id.
//
// See apps/food-calc/tds/ANALYSIS/zero-base-rewrite-2026-05-09.md §Server route
// and apps/food-calc/tds/home-and-analyses-ui.md.

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Long-analysis window bounds — kept in sync with the RangePickerWithFallback
// presets (7/14/21/28/35) on the frontend. The client also disables submit
// outside this range; this is the server-side backstop.
const MIN_WINDOW_DAYS = 7;
const MAX_WINDOW_DAYS = 35;

type AnalyzeBody = {
  id?: string;
  windowStart?: string;
  windowEnd?: string;
  payload?: {
    scheduleFoods?: unknown[];
    scheduleEvents?: unknown[];
    nutrientsByDay?: unknown[];
    hypotheses?: HypothesisContext[];
  };
};

// Sanitise the client's nutrientsByDay into validated DayNutrients[]. Drops
// entries without a string date or with no surviving nutrient lines.
function asNutrientsByDay(v: unknown): DayNutrients[] {
  if (!Array.isArray(v)) return [];
  const out: DayNutrients[] = [];
  for (const item of v) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (typeof o.date !== "string") continue;
    const nutrients = asNutrientLines(o.nutrients);
    if (nutrients.length === 0) continue;
    out.push({ date: o.date, nutrients });
  }
  return out;
}

// Number of calendar days the window covers — INCLUSIVE of both ends, so it
// agrees with the frontend RangePickerWithFallback (a «7 дней» preset sends a
// start/end 6 days apart). Returns null if either timestamp is unparseable.
function windowSpanDays(start: string, end: string): number | null {
  const s = Date.parse(start);
  const e = Date.parse(end);
  if (Number.isNaN(s) || Number.isNaN(e)) return null;
  return Math.round((e - s) / 86_400_000) + 1;
}

type AnalysisRow = {
  id: string;
  user_id: string;
  window_start: Date;
  window_end: Date;
  result_md: string;
  idea_cards: unknown;
  /** Snapshot of {id,title,body}[] the user ticked when starting the job. */
  applied_hypotheses: unknown;
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
    applied_hypotheses: row.applied_hypotheses,
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

    const span = windowSpanDays(start, end);
    if (span === null) {
      return reply.status(400).send({ error: "invalid window dates" });
    }
    if (span < MIN_WINDOW_DAYS || span > MAX_WINDOW_DAYS) {
      return reply.status(400).send({
        error: `window must span ${MIN_WINDOW_DAYS}..${MAX_WINDOW_DAYS} days`,
      });
    }

    const payload: AnalyzePayload = {
      windowStart: start,
      windowEnd: end,
      scheduleFoods: Array.isArray(body.payload?.scheduleFoods)
        ? body.payload!.scheduleFoods!
        : [],
      scheduleEvents: Array.isArray(body.payload?.scheduleEvents)
        ? body.payload!.scheduleEvents!
        : [],
      ...(() => {
        const nutrientsByDay = asNutrientsByDay(body.payload?.nutrientsByDay);
        return nutrientsByDay.length > 0 ? { nutrientsByDay } : {};
      })(),
      ...(Array.isArray(body.payload?.hypotheses)
        ? { hypotheses: body.payload!.hypotheses! }
        : {}),
    };

    // INSERT pending row. The row id IS the idempotency key — a duplicate POST
    // hits the conflict path and returns the existing row without re-firing
    // the LLM.
    const insert = await pool.query<AnalysisRow>(
      `insert into public.analyses
         (id, user_id, window_start, window_end, applied_hypotheses)
       values ($1::uuid, $2::uuid, $3::timestamptz, $4::timestamptz, $5::jsonb)
       on conflict (id) do nothing
       returning *`,
      [id, req.userId, start, end, JSON.stringify(payload.hypotheses ?? [])],
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

  app.get("/analyses", async (req: FastifyRequest, reply: FastifyReply) => {
    if (!pool) return reply.status(500).send({ error: "DB not configured" });
    // Returns pending (result_md=''), failed (result_md starts with "⚠️")
    // and done rows alike — the AnalysesPage list derives the status
    // client-side. result_md is sent whole; trimming it to a server-side
    // status enum is a later optimisation.
    const result = await pool.query<
      Pick<
        AnalysisRow,
        | "id"
        | "window_start"
        | "window_end"
        | "created_at"
        | "result_md"
        | "idea_cards"
        | "applied_hypotheses"
      >
    >(
      `select id, window_start, window_end, created_at,
              result_md, idea_cards, applied_hypotheses
       from public.analyses
       where user_id = $1::uuid
       order by created_at desc
       limit 500`,
      [req.userId],
    );
    return reply.send({
      analyses: result.rows.map((row) => ({
        id: row.id,
        window_start: row.window_start.toISOString(),
        window_end: row.window_end.toISOString(),
        created_at: row.created_at.toISOString(),
        result_md: row.result_md,
        idea_cards: row.idea_cards,
        applied_hypotheses: row.applied_hypotheses,
      })),
    });
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
