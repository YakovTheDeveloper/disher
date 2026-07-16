import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Type } from "@sinclair/typebox";
import { pool } from "../db.js";
import { requireUser } from "../../auth/require-user.js";
import { asNutrientLines } from "../../shared/analysis-output.js";
import { chargeOr402 } from "../../billing/http.js";
import { refund } from "../../billing/wallet.js";
import {
  runAnalysisJob,
  updateAnalysisFailed,
  windowSpanDays,
  USER_MESSAGE_MAX,
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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Analysis window bounds. The weekly UI (RangePickerWithFallback presets
// 7/14/21/28/35) still sends >=7; the floor is 1 so the DAILY flow (collapse of
// the former /api/analyze/daily) rides the same route with a same-day window
// (windowStart === windowEnd, span 1). runAnalysisJob branches the prompt by
// span. The client disables submit outside this range; this is the backstop.
const MIN_WINDOW_DAYS = 1;
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
    userMessage?: unknown;
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

// Coerce the optional free-text «уточнения от пользователя» (daily flow) into a
// trimmed, clamped string. Empty → undefined so it's absent from the payload.
function asUserMessage(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim().slice(0, USER_MESSAGE_MAX);
  return trimmed.length > 0 ? trimmed : undefined;
}

type AnalysisRow = {
  id: string;
  user_id: string;
  window_start: Date;
  window_end: Date;
  result_md: string;
  idea_cards: unknown;
  insights: unknown;
  /** Neutral read-only patterns (reference) — distinct from saveable insights. */
  observations: unknown;
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
    insights: row.insights,
    observations: row.observations,
    applied_hypotheses: row.applied_hypotheses,
    created_at: row.created_at.toISOString(),
  };
}

// Shape only, and shallow on purpose. The window bounds (1..35 days), the
// UUID check and the nutrient/hypothesis sanitisers stay in the handler — they
// are semantics, and the handler answers each with its own message.
//
// The payload arrays are `Type.Unknown()` items rather than a described shape.
// That is honest, not lazy: the handler itself types them `unknown[]` and
// re-sanitises everything it reads. Describing them here would also hand
// Fastify's removeAdditional a licence to silently delete members of the
// user's diary on the way in.
const ANALYZE_BODY_SCHEMA = Type.Object(
  {
    id: Type.String({ description: "Client-generated UUID. Doubles as the idempotency key for the charge and the row." }),
    windowStart: Type.String(),
    windowEnd: Type.String(),
    payload: Type.Optional(
      Type.Object(
        {
          scheduleFoods: Type.Optional(Type.Array(Type.Unknown())),
          scheduleEvents: Type.Optional(Type.Array(Type.Unknown())),
          nutrientsByDay: Type.Optional(Type.Array(Type.Unknown())),
          hypotheses: Type.Optional(Type.Array(Type.Unknown())),
          userMessage: Type.Optional(Type.Unknown()),
        },
        { additionalProperties: false, title: "AnalyzePayload" },
      ),
    ),
  },
  { additionalProperties: false, title: "AnalyzeRequest" },
);

// `id` is a plain string, NOT `format: uuid`. GET/DELETE /analyses/:id answer a
// malformed id with 404 (not found), deliberately — a schema format would turn
// that into a 400 and change a live contract.
const ANALYSIS_ID_PARAMS = Type.Object({ id: Type.String() });

export async function analyzeRoutes(
  app: FastifyInstance,
  opts: AnalyzeRouteOptions = {},
) {
  app.addHook("preHandler", requireUser);

  app.post(
    "/analyze",
    {
      schema: {
        operationId: "startAnalysis",
        tags: ["analysis"],
        description:
          "Start a long analysis over a 1..35 day window. Idempotent per `id`. Paid; the result is filled in asynchronously.",
        security: [{ cookieSession: [] }],
        body: ANALYZE_BODY_SCHEMA,
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
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
        ...(() => {
          const userMessage = asUserMessage(body.payload?.userMessage);
          return userMessage ? { userMessage } : {};
        })(),
      };

      // Paid: debit before inserting. requestId = the analysis id, so a duplicate
      // POST (same id) is idempotent on BOTH the charge and the row — no double
      // debit — and a 402 leaves no orphan pending row. The async job refunds on
      // failure (see analyze.runJob.ts).
      if (!(await chargeOr402(req, reply, "long_analysis", id))) return;

      // INSERT pending row. The row id IS the idempotency key — a duplicate POST
      // hits the conflict path and returns the existing row without re-firing
      // the LLM.
      let insert;
      try {
        insert = await pool.query<AnalysisRow>(
          `insert into public.analyses
             (id, user_id, window_start, window_end, applied_hypotheses)
           values ($1::uuid, $2::uuid, $3::timestamptz, $4::timestamptz, $5::jsonb)
           on conflict (id) do nothing
           returning *`,
          [id, req.userId, start, end, JSON.stringify(payload.hypotheses ?? [])],
        );
      } catch (err) {
        // Charged but couldn't create the job — give the money back.
        await refund(req.userId, "long_analysis", id).catch(() => {});
        throw err;
      }

      if ((insert.rowCount ?? 0) > 0) {
        const row = insert.rows[0];
        // Pass user_id explicitly into the job (and its failure handler) so a
        // failure refund never depends on the row still existing — the user may
        // DELETE a pending analysis before its job fails (see refundAnalysis).
        void runAnalysisJob(row.id, row.user_id, payload, opts.callLLM).catch(
          (err) => updateAnalysisFailed(row.id, row.user_id, err),
        );
        return reply.send({ analysis: serialiseRow(row) });
      }

      // Conflict path. Confirm ownership and return current state.
      const existing = await pool.query<AnalysisRow>(
        `select * from public.analyses where id = $1::uuid and user_id = $2::uuid`,
        [id, req.userId],
      );
      const row = existing.rows[0];
      if (!row) {
        // The id exists but isn't this user's (or vanished). The charge above was
        // a fresh debit for an id we can't serve — refund it.
        await refund(req.userId, "long_analysis", id).catch(() => {});
        return reply.status(404).send({ error: "analysis not found" });
      }
      return reply.send({ analysis: serialiseRow(row) });
    },
  );

  app.get(
    "/analyses",
    {
      schema: {
        operationId: "listAnalyses",
        tags: ["analysis"],
        description:
          "The user's analyses, newest first (max 500). Pending / failed / done alike — the client derives the state from `result_md`.",
        security: [{ cookieSession: [] }],
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
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
          | "insights"
          | "observations"
          | "applied_hypotheses"
        >
      >(
        `select id, window_start, window_end, created_at,
                result_md, idea_cards, insights, observations, applied_hypotheses
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
          insights: row.insights,
          observations: row.observations,
          applied_hypotheses: row.applied_hypotheses,
        })),
      });
    },
  );

  app.get<{ Params: { id: string } }>(
    "/analyses/:id",
    {
      schema: {
        operationId: "getAnalysis",
        tags: ["analysis"],
        description:
          "Poll one analysis. Empty `result_md` = still running; a row starting with «⚠️» = failed.",
        security: [{ cookieSession: [] }],
        params: ANALYSIS_ID_PARAMS,
      },
    },
    async (req, reply) => {
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
    },
  );

  // DELETE /api/analyses/:id — drop one of the current user's analyses. The
  // `user_id` predicate is the ownership guard: another user's id deletes
  // nothing and gets a 404, identical to the GET shape. No refund — a finished
  // (or paid-for, still-pending) analysis is a consumed product; deleting it is
  // a UI tidy-up, not a cancellation. Idempotent on the surface: a second
  // delete of the same id is a 404 (already gone), which the optimistic-remove
  // frontend treats as success.
  app.delete<{ Params: { id: string } }>(
    "/analyses/:id",
    {
      schema: {
        operationId: "deleteAnalysis",
        tags: ["analysis"],
        description:
          "Drop one of the user's analyses. No refund — a paid-for analysis is a consumed product. A second delete is a 404.",
        security: [{ cookieSession: [] }],
        params: ANALYSIS_ID_PARAMS,
      },
    },
    async (req, reply) => {
      if (!pool) return reply.status(500).send({ error: "DB not configured" });
      const id = req.params.id;
      if (!UUID_RE.test(id))
        return reply.status(404).send({ error: "not found" });
      const result = await pool.query(
        `delete from public.analyses
         where id = $1::uuid and user_id = $2::uuid`,
        [id, req.userId],
      );
      if ((result.rowCount ?? 0) === 0)
        return reply.status(404).send({ error: "not found" });
      return reply.send({ ok: true });
    },
  );
}
