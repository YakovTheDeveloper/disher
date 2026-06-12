import type { FastifyInstance } from "fastify";
import { requireUser } from "../../auth/require-user.js";
import {
  ANALYSIS_OUTPUT_PROMPT_SPEC,
  DISH_DETAILS_INSTRUCTION,
  NUTRIENT_ANCHOR_INSTRUCTION,
  asNutrientLines,
  nutrientLineToken,
  type NutrientLine,
} from "../../shared/analysis-output.js";
import { callLLMWithValidation, type CallLLM } from "./analyze.runJob.js";
import { chargeOr402, resolveRequestId } from "../../billing/http.js";
import { refund } from "../../billing/wallet.js";

// POST /api/analyze/daily — single JSON response (NOT SSE). The "daily
// analysis" — a one-day review of the user's meals + health tags. The frontend
// hydrates the day's payload from Dexie + catalog (human-readable names, not
// product_id UUIDs) and posts it; the backend calls OpenRouter once with the
// shared structured-output contract and returns the parsed {summary, insights,
// hypotheses}.
//
// Why no Postgres row (unlike /api/analyze): a daily review is cheap and short,
// and the result is persisted client-side in idb-keyval keyed by date. Re-run =
// re-post = overwrite. No idempotency key, no polling endpoint.
//
// Why not streaming (history): the daily flow used to forward an SSE markdown
// stream. We switched to a deterministic JSON contract shared with the long
// analysis (summary + grounded insights + addable hypotheses) — the structure
// is worth losing the live-text feel. See
// apps/food-calc/tds/analysis-structured-output.md.

// One day is a small payload; the model rarely needs the long-analysis budget.
const DAILY_TIMEOUT_MS = 60_000;

// System prompt is net-new — it does NOT reuse SYSTEM_PROMPT_BASE (that one
// carries the cohort-mining paragraph). A one-day window has no cross-day
// cohorts, so DETAILS_COHORT_INSTRUCTION is omitted; DISH_DETAILS_INSTRUCTION
// is included (the `[особенности: …]` bracket-tag rides in from the client's
// collectFoods hydration). The output contract is the SHARED one.
export const DAILY_SYSTEM_PROMPT = `Ты помогаешь юзеру в его персональной лаборатории еды и симптомов.
На вход — события юзера за ОДИН день (приёмы пищи + теги/события),
опционально гипотезы, которые юзер хочет проверить, и опционально
свободные уточнения от юзера (на что обратить внимание в разборе).
Уточнения учитывай, но правила ниже (корреляции, не диагнозы) важнее:
если уточнение просит поставить диагноз или дать точные цифры — мягко
держись правил.

Это разбор одного дня, не недельный. Паттернов между днями тут нет —
не выдумывай их. Смотри на то, что доступно внутри дня:
- последовательность «еда → самочувствие» по времени (что съедено до
  отмеченного симптома и за сколько часов);
- время приёмов пищи и промежутки между ними;
- состав дня в целом — что преобладало, чего не было;
- если юзер отметил гипотезы — соблюдалось ли это в еде дня.

В тексте события юзер часто сам называет и явление, и предполагаемую причину
(«болела голова из-за недосыпа», «бодрость после кофе»). Читай text событий:
соотноси отмеченные явления с едой дня по времени, а названную причину считай
гипотезой юзера, а не фактом. Шкальные оценки (1–10) — это сила явления,
учитывай величину, а не только сам факт.

Не превращай разбор в калькулятор БЖУ и не ставь диагнозов. Корреляции
и наблюдения, не точные цифры. Если день пустой или данных мало — так
и скажи в summary, а insights и hypotheses оставь пустыми.

${DISH_DETAILS_INSTRUCTION}

${NUTRIENT_ANCHOR_INSTRUCTION}

${ANALYSIS_OUTPUT_PROMPT_SPEC}

Окно — это один день, поэтому evidence.days у каждого наблюдения — просто этот день.`;

type HypothesisInput = { title: string; body: string };

// Optional free-text «уточнения от пользователя» — clamped so a runaway paste
// can't bloat the prompt. Plain text, no markdown contract.
const USER_MESSAGE_MAX = 1000;

type AnalyzeDailyBody = {
  date?: unknown;
  scheduleFoods?: unknown;
  scheduleEvents?: unknown;
  nutrients?: unknown;
  hypotheses?: unknown;
  userMessage?: unknown;
};

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

// Project the posted hypotheses to {title, body} only. The client may send
// {id,title,body} (its snapshot shape); the id is bookkeeping and must not
// reach the LLM prompt — drop it here.
function asHypotheses(v: unknown): HypothesisInput[] {
  if (!Array.isArray(v)) return [];
  const out: HypothesisInput[] = [];
  for (const h of v) {
    if (!h || typeof h !== "object") continue;
    const o = h as Record<string, unknown>;
    const title = typeof o.title === "string" ? o.title : "";
    const body = typeof o.body === "string" ? o.body : "";
    if (!title && !body) continue;
    out.push({ title, body });
  }
  return out;
}

export function buildDailyUserPrompt(
  date: string,
  scheduleFoods: unknown[],
  scheduleEvents: unknown[],
  hypotheses: HypothesisInput[],
  nutrients: NutrientLine[] = [],
  userMessage = "",
): string {
  const lines: string[] = [];
  lines.push(`День: ${date || "(дата не указана)"}`);
  lines.push("");
  lines.push(`Приёмы пищи за день (${scheduleFoods.length}):`);
  lines.push(JSON.stringify(scheduleFoods));
  lines.push("");
  lines.push(`События и теги за день (${scheduleEvents.length}):`);
  lines.push(JSON.stringify(scheduleEvents));
  if (nutrients.length > 0) {
    lines.push("");
    lines.push("Ориентировочные суммы нутриентов за день (приблизительно):");
    for (const n of nutrients) lines.push(`- ${nutrientLineToken(n)}`);
  }
  if (hypotheses.length > 0) {
    lines.push("");
    lines.push(
      "Гипотезы, которые юзер хочет проверить — посмотри, соблюдались ли они в еде дня:",
    );
    for (const h of hypotheses) {
      lines.push(`- ${h.title}: ${h.body}`);
    }
  }
  if (userMessage) {
    lines.push("");
    lines.push("Уточнения от пользователя — учти при разборе:");
    lines.push(userMessage);
  }
  return lines.join("\n");
}

type AnalyzeDailyRouteOptions = {
  /** Test-only: replace the OpenRouter call with a stub. Same CallLLM contract
   *  as the long analysis — returns the raw model string, parsed downstream. */
  callLLM?: CallLLM;
};

export async function analyzeDailyRoutes(
  app: FastifyInstance,
  opts: AnalyzeDailyRouteOptions = {},
) {
  app.addHook("preHandler", requireUser);

  app.post("/analyze/daily", async (req, reply) => {
    const body = (req.body ?? {}) as AnalyzeDailyBody;
    const date = asString(body.date);
    const scheduleFoods = asArray(body.scheduleFoods);
    const scheduleEvents = asArray(body.scheduleEvents);
    const nutrients = asNutrientLines(body.nutrients);
    const hypotheses = asHypotheses(body.hypotheses);
    const userMessage = asString(body.userMessage).trim().slice(0, USER_MESSAGE_MAX);

    if (!date.trim()) {
      return reply.status(400).send({ error: "date required" });
    }

    // Safety net behind the client gate: an empty day (no foods AND no events)
    // would only burn a tiny LLM call on a «день пустой» reply. A day with
    // food but no health events is still valid — only reject when both empty.
    if (scheduleFoods.length === 0 && scheduleEvents.length === 0) {
      return reply.status(400).send({ error: "empty day" });
    }

    // Paid: debit before calling the model so an insufficient-balance 402 is a
    // clean JSON reply. Refund if the call/parse fails.
    const requestId = resolveRequestId(req);
    if (!(await chargeOr402(req, reply, "daily_analysis", requestId))) return;

    const userPrompt = buildDailyUserPrompt(
      date,
      scheduleFoods,
      scheduleEvents,
      hypotheses,
      nutrients,
      userMessage,
    );

    try {
      const result = await callLLMWithValidation(
        DAILY_SYSTEM_PROMPT,
        userPrompt,
        AbortSignal.timeout(DAILY_TIMEOUT_MS),
        opts.callLLM,
      );
      return reply.send({ analysis: result });
    } catch (err) {
      await refund(req.userId, "daily_analysis", requestId).catch(() => {});
      const msg = err instanceof Error ? err.message : String(err);
      return reply
        .status(502)
        .send({ error: "analysis-failed", detail: msg.slice(0, 200) });
    }
  });
}
