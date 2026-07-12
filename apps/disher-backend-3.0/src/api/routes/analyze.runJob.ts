import { pool } from "../db.js";
import { refund } from "../../billing/wallet.js";
import {
  CRITIC_SYSTEM_PROMPT,
  DAILY_SYSTEM_PROMPT,
  SYSTEM_PROMPT_BASE,
  applyCriticVerdicts,
  nutrientLineToken,
  parseCriticVerdicts,
  safeStringifyArray,
  serializeDraftForCritic,
  stripNullBytes,
  tryParseOutput,
  type AnalysisOutput,
  type NutrientLine,
} from "../../shared/analysis-output.js";

// Background runner for /api/analyze. Invoked as `void runAnalysisJob(...)`
// from the route. State for an analysis row is *derived*: result_md='' means
// pending, anything else means done (success or failure). Failure becomes
// content — there's no separate error column, status enum, or status check
// to keep in sync.
//
// See apps/food-calc/tds/ANALYSIS/zero-base-rewrite-2026-05-09.md §Server route.

const LLM_TIMEOUT_MS = 120_000;

const FOODS_BUDGET = 80_000;
const EVENTS_BUDGET = 80_000;
const HYPOTHESES_BUDGET = 8_000;
// Per-day nutrient anchor lines. Compact (one line per day) but still capped:
// 35 days × ~30 nutrients can add up. Oldest days drop first if over budget.
const NUTRIENTS_BUDGET = 40_000;

const FAILURE_PREFIX = "⚠️ Анализ не удался";

// Optional free-text «уточнения от пользователя», carried by a window===1
// (daily) analysis. Clamped so a runaway paste can't bloat the prompt. Plain
// text, no markdown contract. Kept transit-only — not persisted to a column.
export const USER_MESSAGE_MAX = 1000;

// Calendar days the window covers, INCLUSIVE of both ends — a same-day window
// (windowStart === windowEnd) is 1, the «7 дней» preset (endpoints 6 days apart)
// is 7. Single source of truth for both the route's window guard and this
// module's daily-vs-weekly prompt branch. Returns null if a timestamp is
// unparseable.
export function windowSpanDays(start: string, end: string): number | null {
  const s = Date.parse(start);
  const e = Date.parse(end);
  if (Number.isNaN(s) || Number.isNaN(e)) return null;
  return Math.round((e - s) / 86_400_000) + 1;
}

// A failed long analysis produced no usable result → refund the kickoff charge.
// requestId is the analysis id (see analyze.ts chargeOr402); refund is idempotent,
// so calling this from both the in-job catch and updateAnalysisFailed is safe.
// Best-effort — a refund hiccup must not mask the original failure.
//
// `userId` is passed in (known at kick time) rather than looked up via the
// analyses row: a user can DELETE a still-pending analysis, and a later
// job-failure refund that read user_id THROUGH that deleted row would find
// nothing and silently skip the refund. The charge is keyed on (userId,
// "long_analysis", analysisId), all of which are known without the row.
async function refundAnalysis(analysisId: string, userId: string): Promise<void> {
  if (!pool) return;
  try {
    await refund(userId, "long_analysis", analysisId);
  } catch {
    /* best-effort refund */
  }
}

// Threshold past which a still-pending analysis (result_md='') can only be a
// job orphaned by a process restart/crash — the in-memory runner that would
// have finished or refunded it is gone. Comfortably above the 120s job window
// so a live, slow job is never swept.
const STALE_PENDING_MS = 10 * 60 * 1000;

// Startup-sweep: on process boot, fail + refund any analysis left pending by a
// previous process that died mid-job (deploy/restart/crash). Without this the
// user's 5 ₽ charge is burned and the row hangs pending forever — the refund
// path only ever ran in-process. refund is idempotent and the update is guarded
// on `result_md = ''`, so racing a (theoretical) still-live job is safe: a job
// that just succeeded won't be clobbered, and a double refund can't happen.
// Returns the number of rows actually swept (for logging/tests).
export async function sweepStaleAnalyses(): Promise<number> {
  if (!pool) return 0;
  const cutoffIso = new Date(Date.now() - STALE_PENDING_MS).toISOString();
  const stale = await pool.query<{ id: string; user_id: string }>(
    `select id, user_id from public.analyses
      where result_md = '' and created_at < $1::timestamptz`,
    [cutoffIso],
  );
  let swept = 0;
  for (const row of stale.rows) {
    const upd = await pool.query(
      `update public.analyses
          set result_md = $1, idea_cards = '[]'::jsonb,
              insights = '[]'::jsonb, observations = '[]'::jsonb
        where id = $2::uuid and result_md = ''`,
      [`${FAILURE_PREFIX}: прерван перезапуском сервера`, row.id],
    );
    // Guard matched (still pending) → this row is really ours to fail. If a job
    // finished between the select and here, rowCount is 0 and we skip the refund
    // (a done job keeps its money).
    if ((upd.rowCount ?? 0) > 0) {
      await refundAnalysis(row.id, row.user_id);
      swept += 1;
    }
  }
  return swept;
}

// Snapshot shape of a hypothesis the user ticked for this analysis. `id` is
// kept for the persisted `applied_hypotheses` snapshot (future link to the
// live hypothesis); it is NOT projected into the LLM prompt — see
// buildUserPrompt.
export type HypothesisContext = {
  id: string;
  title: string;
  body: string;
};

export type DayNutrients = { date: string; nutrients: NutrientLine[] };

export type AnalyzePayload = {
  windowStart: string;
  windowEnd: string;
  scheduleFoods: unknown[];
  scheduleEvents: unknown[];
  nutrientsByDay?: DayNutrients[];
  hypotheses?: HypothesisContext[];
  /** Free-text «уточнения от пользователя» — only sent for a daily (window===1)
   *  analysis. Transit-only: folded into the prompt, never stored. */
  userMessage?: string;
};

export type CallLLMOptions = {
  signal: AbortSignal;
};

export type CallLLM = (
  systemPrompt: string,
  userPrompt: string,
  options: CallLLMOptions,
) => Promise<string>;

export { SYSTEM_PROMPT_BASE };

function buildUserPrompt(payload: AnalyzePayload): string {
  const lines: string[] = [];
  lines.push(`Окно: ${payload.windowStart} — ${payload.windowEnd}`);

  const foods = safeStringifyArray(payload.scheduleFoods, FOODS_BUDGET);
  lines.push(
    `Приёмы пищи (всего ${payload.scheduleFoods.length}, в промпте ${foods.kept}):`,
  );
  lines.push(foods.json);

  const events = safeStringifyArray(payload.scheduleEvents, EVENTS_BUDGET);
  lines.push(
    `События (всего ${payload.scheduleEvents.length}, в промпте ${events.kept}):`,
  );
  lines.push(events.json);

  if (payload.nutrientsByDay && payload.nutrientsByDay.length > 0) {
    // One compact line per day. Keep the most recent days if over budget
    // (drop from the start), so the window's tail — usually what the user
    // cares about — survives.
    const dayLines = payload.nutrientsByDay.map(
      (d) => `${d.date}: ${d.nutrients.map(nutrientLineToken).join(", ")}`,
    );
    const kept: string[] = [];
    let used = 0;
    for (let i = dayLines.length - 1; i >= 0; i--) {
      const cost = dayLines[i].length + 1;
      if (used + cost > NUTRIENTS_BUDGET) break;
      used += cost;
      kept.unshift(dayLines[i]);
    }
    lines.push("");
    lines.push(
      `Ориентировочные суммы нутриентов по дням (приблизительно, в промпте ${kept.length} из ${dayLines.length} дней):`,
    );
    lines.push(...kept);
  }

  if (payload.hypotheses && payload.hypotheses.length > 0) {
    // Project to {title, body} only — the id (UUID) is snapshot bookkeeping,
    // useless noise in the LLM prompt. Strip the <hypotheses> tag from user
    // text so it can't break out of the wrapper.
    const safe = payload.hypotheses.map((h) => ({
      title: h.title.replace(/<\/?hypotheses>/g, ""),
      body: h.body.replace(/<\/?hypotheses>/g, ""),
    }));
    const wrapped = safeStringifyArray(safe, HYPOTHESES_BUDGET);
    lines.push("");
    lines.push(
      "Юзер хочет проверить следующие гипотезы — учти их в разборе и не предлагай дубли:",
    );
    lines.push("<hypotheses>");
    lines.push(wrapped.json);
    lines.push("</hypotheses>");
  }

  if (payload.userMessage) {
    // Free-text clarification from the user (daily flow). Already trimmed +
    // clamped at the route; strip the wrapper tag defensively so it can't break
    // out of its section.
    const safe = payload.userMessage
      .replace(/<\/?user-message>/g, "")
      .slice(0, USER_MESSAGE_MAX);
    lines.push("");
    lines.push("Уточнения от пользователя — учти при разборе:");
    lines.push("<user-message>");
    lines.push(safe);
    lines.push("</user-message>");
  }

  return lines.join("\n");
}

// Core OpenRouter call, parametrised by model so the generator and the critic
// (a DIFFERENT, also-cheap model — diversity guards against the false-consensus
// two identical models fall into) can share one code path.
async function fetchLLMWithModel(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  options: CallLLMOptions,
): Promise<string> {
  const { signal } = options;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const MAX_RETRIES = 3;
  let response!: Response;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1500 * attempt));
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
      signal,
    });
    if (response.status !== 429) break;
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${body.slice(0, 500)}`);
  }
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty LLM response");
  return String(content);
}

// Generator call — the existing behaviour, model from SUGGESTION_MODEL.
async function fetchLLMOnce(
  systemPrompt: string,
  userPrompt: string,
  options: CallLLMOptions,
): Promise<string> {
  const model = process.env.SUGGESTION_MODEL ?? "google/gemini-2.5-flash-lite";
  return fetchLLMWithModel(model, systemPrompt, userPrompt, options);
}

// Experimental critic stage (gated by ANALYSIS_CRITIC=on). Runs a cheap,
// DIFFERENT model as a skeptic that prunes/softens the generator's draft. This
// is a BEST-EFFORT quality layer: any failure (no findings, bad JSON, network,
// timeout) returns the original draft unchanged — it must never break the paid
// analysis path. Model comes from CRITIC_MODEL; falls back to SUGGESTION_MODEL
// (still gives the skeptic-role diversity, just not model diversity).
async function critiqueDraft(
  draft: AnalysisOutput,
  userPrompt: string,
  options: CallLLMOptions,
  callCritic: CallLLM,
): Promise<AnalysisOutput> {
  // Nothing gradable ⇒ nothing to critique.
  if (draft.observations.length === 0 && draft.insights.length === 0) return draft;

  const criticUserPrompt = `${userPrompt}\n\nЧерновик находок для проверки:\n<draft>\n${serializeDraftForCritic(draft)}\n</draft>`;
  try {
    const raw = await callCritic(CRITIC_SYSTEM_PROMPT, criticUserPrompt, options);
    const verdicts = parseCriticVerdicts(raw);
    if (verdicts.length === 0) return draft;
    return applyCriticVerdicts(draft, verdicts);
  } catch {
    return draft; // best-effort — never fail the analysis on a critic hiccup
  }
}

function makeCriticCall(): CallLLM {
  const model =
    process.env.CRITIC_MODEL ??
    process.env.SUGGESTION_MODEL ??
    "google/gemini-2.5-flash-lite";
  return (systemPrompt, userPrompt, options) =>
    fetchLLMWithModel(model, systemPrompt, userPrompt, options);
}

export async function callLLMWithValidation(
  systemPrompt: string,
  userPrompt: string,
  signal: AbortSignal,
  callLLM: CallLLM = fetchLLMOnce,
): Promise<AnalysisOutput> {
  const opts: CallLLMOptions = { signal };
  const first = await callLLM(systemPrompt, userPrompt, opts);
  const parsed = tryParseOutput(first);
  if (parsed) return stripNullBytes(parsed);
  const second = await callLLM(systemPrompt, userPrompt, opts);
  const reparsed = tryParseOutput(second);
  if (reparsed) return stripNullBytes(reparsed);
  throw new Error("invalid-output");
}

export async function runAnalysisJob(
  analysisId: string,
  userId: string,
  payload: AnalyzePayload,
  callLLM: CallLLM = fetchLLMOnce,
  callCritic: CallLLM = makeCriticCall(),
): Promise<void> {
  if (!pool) throw new Error("DB pool not initialised");

  // Daily (window===1) vs weekly (window>=7) branch. A single-day window has no
  // cross-day cohorts, so it runs on DAILY_SYSTEM_PROMPT (no cohort-mining);
  // anything longer keeps SYSTEM_PROMPT_BASE. null span (unparseable dates)
  // falls back to the weekly base — the route's guard already rejects those.
  const span = windowSpanDays(payload.windowStart, payload.windowEnd);
  const isDaily = span === 1;

  // Empty-day short-circuit (backstop behind the client's `dailyDisabled` gate):
  // a daily window with no foods AND no events has nothing to analyse — don't
  // burn an LLM call. Resolve the pending row with a short «день пустой» summary
  // and refund the kickoff charge.
  if (
    isDaily &&
    payload.scheduleFoods.length === 0 &&
    payload.scheduleEvents.length === 0
  ) {
    await pool.query(
      `update public.analyses
       set result_md = $1, idea_cards = '[]'::jsonb, insights = '[]'::jsonb, observations = '[]'::jsonb
       where id = $2::uuid and result_md = ''`,
      ["День пустой — за этот день нет ни еды, ни событий для разбора.", analysisId],
    );
    await refundAnalysis(analysisId, userId);
    return;
  }

  const signal = AbortSignal.timeout(LLM_TIMEOUT_MS);
  const userPrompt = buildUserPrompt(payload);

  try {
    const draft = await callLLMWithValidation(
      isDaily ? DAILY_SYSTEM_PROMPT : SYSTEM_PROMPT_BASE,
      userPrompt,
      signal,
      callLLM,
    );
    // Experimental skeptic pass — gated by env, best-effort (returns the draft
    // untouched on any failure). Off by default ⇒ identical to the old path.
    const result =
      process.env.ANALYSIS_CRITIC === "on"
        ? await critiqueDraft(draft, userPrompt, { signal }, callCritic)
        : draft;
    // summary lives in result_md — guard against an empty string, which would
    // make deriveStatus read the done row as forever-pending (result_md === '').
    const summaryMd = result.summary.trim() || "Разбор готов.";
    await pool.query(
      `update public.analyses
       set result_md = $1, idea_cards = $2::jsonb, insights = $3::jsonb, observations = $4::jsonb
       where id = $5::uuid and result_md = ''`,
      [
        summaryMd,
        JSON.stringify(result.hypotheses),
        JSON.stringify(result.insights),
        JSON.stringify(result.observations),
        analysisId,
      ],
    );
  } catch (err) {
    const reason =
      err instanceof Error
        ? err.name === "TimeoutError"
          ? "timeout"
          : err.message
        : String(err);
    await pool
      .query(
        `update public.analyses
         set result_md = $1, idea_cards = '[]'::jsonb, insights = '[]'::jsonb, observations = '[]'::jsonb
         where id = $2::uuid and result_md = ''`,
        [`${FAILURE_PREFIX}: ${reason.slice(0, 500)}`, analysisId],
      )
      .catch(() => {});
    await refundAnalysis(analysisId, userId);
  }
}

export async function updateAnalysisFailed(
  analysisId: string,
  userId: string,
  err: unknown,
): Promise<void> {
  if (!pool) return;
  const reason = err instanceof Error ? err.message : String(err);
  await pool
    .query(
      `update public.analyses
       set result_md = $1, idea_cards = '[]'::jsonb
       where id = $2::uuid and result_md = ''`,
      [`${FAILURE_PREFIX}: ${reason.slice(0, 500)}`, analysisId],
    )
    .catch(() => {});
  await refundAnalysis(analysisId, userId);
}
