import type { FastifyInstance } from "fastify";
import { requireUser } from "../../auth/require-user.js";
import {
  ANALYSIS_OUTPUT_PROMPT_SPEC,
  DISH_DETAILS_INSTRUCTION,
  ISOLATED_FOOD_INSIGHT_INSTRUCTION,
} from "../../shared/analysis-output.js";
import { callLLMWithValidation, type CallLLM } from "./analyze.runJob.js";
import { chargeOr402, resolveRequestId } from "../../billing/http.js";
import { refund } from "../../billing/wallet.js";

// POST /api/analyze-dish — single JSON response (NOT SSE). The frontend hydrates
// the dish payload (name, total grams, ingredients) from Dexie + catalog and
// posts it; the backend calls OpenRouter once with the SHARED structured-output
// contract and returns the parsed {summary, observations:[], insights,
// hypotheses:[]} — a dish has no day-patterns, so observations is always empty
// (its valenced compositional findings ride in insights). The result is
// persisted on the client in idb-keyval under `dish-analysis:<dishId>`.
// Re-run = re-post = overwrite.
//
// Why no Postgres row (unlike /api/analyze): a per-dish analysis is cheap, and
// the result lives next to the dish (a screen of DishBuilderPage). No
// cross-device history is owed; the latest backup snapshot already carries the
// dish itself — losing an analysis on device swap is acceptable.
//
// Why not streaming (history): the dish flow used to forward an SSE markdown
// stream. We switched to the deterministic JSON contract shared with the daily
// and long analyses — a short prose summary plus compositional insights
// (nutrient synergies/antagonisms) the user can save. A dish has no temporal
// window, so it never produces hypotheses (hypotheses: [] always). See
// apps/food-calc/tds/hypotheses-insights.md §3.4.

// A single dish is a small payload; mirrors the daily timeout.
const DISH_TIMEOUT_MS = 60_000;

type Ingredient = {
  name?: unknown;
  grams?: unknown;
  details?: unknown;
};

type AnalyzeDishBody = {
  dishName?: unknown;
  totalGrams?: unknown;
  ingredients?: unknown;
};

// System prompt is net-new — it does NOT reuse SYSTEM_PROMPT_BASE (that one
// carries the cross-day cohort-mining paragraph, irrelevant to a single dish).
// A dish has no days and no events: every insight is COMPOSITIONAL (nutrient
// synergy/antagonism among the ingredients), grounded by evidence.foods — the
// relaxed grounding gate in tryParseOutput lets foods-only insights through.
// hypotheses are always empty for a dish. The output contract is the SHARED one.
export const DISH_SYSTEM_PROMPT = `Ты — нутрициолог-аналитик. На вход — рецепт одного блюда (название, общий вес,
список ингредиентов с граммовкой и необязательной заметкой по способу готовки).
Задача: дать структурный разбор состава блюда. Не калькулятор и не диагноз —
качественные характеристики и связки, а не точные цифры.

Это разбор одного блюда, не дня и не окна. Дней и событий тут нет вообще —
не выдумывай их. Смотри на сам состав:
- что преобладает по БЖУ, чего дефицитно;
- гликемические свойства (быстрые/медленные углеводы, ощущение после еды);
- для каких целей блюдо уместно (тренировка, ужин, восстановление…);
- синергии и антагонизмы нутриентов между ингредиентами.

${DISH_DETAILS_INSTRUCTION}

${ISOLATED_FOOD_INSIGHT_INSTRUCTION}

${ANALYSIS_OUTPUT_PROMPT_SPEC}

Для разбора блюда:
- summary — 1–3 предложения прозой: БЖУ-профиль, гликемические свойства, для чего блюдо подходит. Это суть разбора, кратко и по делу.
- observations — ВСЕГДА пустой массив []. У блюда нет дней и событий-паттернов; нейтральные качественные характеристики состава идут в summary, а удачные/неудачные связки — в insights.
- insights — синергии и антагонизмы состава этого блюда (полезно/вредно). У КАЖДОГО insight valence ОБЯЗАТЕЛЬНО ("positive"/"negative") и evidence.foods ОБЯЗАТЕЛЬНО (ингредиенты, о которых речь), а evidence.days оставляй ПУСТЫМ массивом — у блюда нет дней. Не выдумывай связки, которых нет в составе.
- hypotheses — ВСЕГДА пустой массив []. У блюда нет временного окна, проверять нечего.`;

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asNumber(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function asIngredients(v: unknown): Ingredient[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is Ingredient => !!x && typeof x === "object");
}

export function buildDishUserPrompt(
  dishName: string,
  totalGrams: number,
  ingredients: Ingredient[],
): string {
  const lines: string[] = [];
  const trimmedName = dishName.trim() || "(без названия)";
  const header = totalGrams > 0
    ? `Блюдо: ${trimmedName} (~${totalGrams}г общий вес)`
    : `Блюдо: ${trimmedName}`;
  lines.push(header);
  lines.push("");
  lines.push("Ингредиенты:");
  if (ingredients.length === 0) {
    lines.push("(нет ингредиентов)");
  } else {
    for (const it of ingredients) {
      const name = asString(it.name).trim() || "?";
      const grams = asNumber(it.grams);
      const details = asString(it.details).trim();
      const base = grams > 0 ? `- ${name}: ${grams}г` : `- ${name}`;
      lines.push(details ? `${base} [${details}]` : base);
    }
  }
  return lines.join("\n");
}

type AnalyzeDishRouteOptions = {
  /** Test-only: replace the OpenRouter call with a stub. Same CallLLM contract
   *  as the daily/long analysis — returns the raw model string, parsed
   *  downstream by callLLMWithValidation. */
  callLLM?: CallLLM;
};

export async function analyzeDishRoutes(
  app: FastifyInstance,
  opts: AnalyzeDishRouteOptions = {},
) {
  app.addHook("preHandler", requireUser);

  app.post("/analyze-dish", async (req, reply) => {
    const body = (req.body ?? {}) as AnalyzeDishBody;
    const dishName = asString(body.dishName);
    const totalGrams = asNumber(body.totalGrams);
    const ingredients = asIngredients(body.ingredients);

    if (!dishName.trim() && ingredients.length === 0) {
      return reply
        .status(400)
        .send({ error: "dishName or ingredients required" });
    }

    // Paid: debit before calling the model so an insufficient-balance 402 is a
    // clean JSON reply. Refund if the call/parse fails.
    const requestId = resolveRequestId(req);
    if (!(await chargeOr402(req, reply, "dish_analysis", requestId))) return;

    const userPrompt = buildDishUserPrompt(dishName, totalGrams, ingredients);

    try {
      const result = await callLLMWithValidation(
        DISH_SYSTEM_PROMPT,
        userPrompt,
        AbortSignal.timeout(DISH_TIMEOUT_MS),
        opts.callLLM,
      );
      // A dish never produces day-pattern observations or hypotheses — enforce
      // both on the server so the contract holds even if the model emits some.
      return reply.send({
        analysis: { ...result, observations: [], hypotheses: [] },
      });
    } catch (err) {
      await refund(req.userId, "dish_analysis", requestId).catch(() => {});
      const msg = err instanceof Error ? err.message : String(err);
      return reply
        .status(502)
        .send({ error: "analysis-failed", detail: msg.slice(0, 200) });
    }
  });
}
