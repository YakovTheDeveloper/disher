// Shared "name → catalog product" categorization pipeline.
//
// Two LLM front-ends feed the SAME backbone (compiler mental model):
//   • head B "normalize names" — free-text-food/parse (text → canonical names)
//   • head A "infer recipe"    — suggestions/dish-products (dish name → ingredients)
// Both emit `LLMItem[]` (canonical names + grams + optional details/time); this
// module matches each name against the catalog (alias → hybrid matcher) and
// buckets it into resolved / ambiguous / unresolved by SCORE_FLOOR + margin,
// returning the shared `ParseResponse` the frontend `useWriteFoodFlow` consumes.
//
// Extracted verbatim from free-text-food.ts (2026-06-05) so the mature parse
// path and the new dish-suggestion path can't drift. free-text-food.test.ts is
// the regression guard for this logic.

import {
  lookupAlias,
  matchOne,
  normalizeForEmbedding,
  type MatchCandidate,
} from "./food-matcher.js";
import { logMatcherQuery } from "./matcher-query-log.js";
import { MATCHER_VERSION, getLLMModel } from "./build-info.js";

// ─── Types ───

export interface LLMItem {
  type?: "product" | "dish";
  name: string;
  details?: string;
  quantity: number | null;
  time: string | null;
}

export interface ResolvedItem {
  productId: string;
  name: string;
  originalName: string;
  details: string;
  quantity: number;
  time: string;
  confidence: number;
}

export interface AmbiguousItem {
  originalName: string;
  details: string;
  quantity: number;
  time: string;
  candidates: MatchCandidate[];
}

export interface UnresolvedItem {
  originalName: string;
  details: string;
  quantity: number;
  time: string;
}

export interface ParseResponse {
  requestId: string;
  resolved: ResolvedItem[];
  ambiguous: AmbiguousItem[];
  unresolved: UnresolvedItem[];
}

// Strict JSON-schema for the `{ items: LLMItem[] }` envelope BOTH heads emit.
// Shared so head A (suggestions) and head B (free-text) can't drift. Used as
// OpenRouter `response_format: { type: "json_schema", json_schema: ... }` with
// `provider.require_parameters: true` so only structured-output-capable models
// are routed to (deepseek-v4-flash). Strict mode requires every property in
// `required` + `additionalProperties: false`; optionals use nullable unions.
// The fence-strip + JSON.parse fallback stays as defense in depth.
export const LLM_ITEMS_JSON_SCHEMA = {
  name: "food_items",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            type: { type: "string", enum: ["product", "dish"] },
            name: { type: "string" },
            details: { type: "string" },
            quantity: { type: ["number", "null"] },
            time: { type: ["string", "null"] },
          },
          required: ["type", "name", "details", "quantity", "time"],
        },
      },
    },
    required: ["items"],
  },
} as const;

// ─── Thresholds (calibrated from probe-parse logs 2026-04) ───
//
// e5-small на русском выдаёт узкий диапазон score (0.83–0.91). Типичный
// margin top1-top2 для корректного top-1 — 0.003–0.008. Раньше было 0.02 →
// 83% запросов падали в ambiguous даже когда top-1 был правильный.
// Новый порог 0.003 оставляет место для реально сомнительных (margin < 0.003 =
// почти ничья, честно показать пользователю кандидатов).
export const SCORE_FLOOR = 0.8;
export const AUTO_ACCEPT_MARGIN = 0.003;

// ─── Quantity fallback ───

export const QUANTITY_FALLBACK_G = 100;

// ─── Time defaults ───

const DEFAULT_SLOTS = ["08:00", "13:00", "16:00", "19:00"];

function isValidTime(t: unknown): t is string {
  return typeof t === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
}

export function fillDefaultTimes(items: LLMItem[]): string[] {
  // Walk left-to-right; if missing, take next default slot after the last used time.
  const filled: string[] = new Array(items.length);
  let slotIdx = 0;
  let lastTime: string | null = null;
  for (let i = 0; i < items.length; i++) {
    const t = items[i].time;
    if (isValidTime(t)) {
      filled[i] = t;
      lastTime = t;
      // Bump slotIdx past any default slots ≤ lastTime.
      while (slotIdx < DEFAULT_SLOTS.length && DEFAULT_SLOTS[slotIdx] <= lastTime) slotIdx++;
    } else {
      const candidate = DEFAULT_SLOTS[Math.min(slotIdx, DEFAULT_SLOTS.length - 1)];
      filled[i] = candidate;
      lastTime = candidate;
      slotIdx = Math.min(slotIdx + 1, DEFAULT_SLOTS.length - 1);
    }
  }
  return filled;
}

// ─── Pipeline ───

/**
 * Match each LLM-extracted name against the catalog and bucket it.
 *
 * @param phrase  the user phrase (head B) or dish name (head A) — for query logs.
 *                Dish-sourced items carry a default `time` that the dish UI
 *                ignores (`hideTime`); it's a no-op field on a dish row.
 */
export async function resolveNames(
  items: LLMItem[],
  phrase: string,
  requestId: string,
): Promise<ParseResponse> {
  const times = fillDefaultTimes(items);
  const llmModel = getLLMModel();

  const resolved: ResolvedItem[] = [];
  const ambiguous: AmbiguousItem[] = [];
  const unresolved: UnresolvedItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const time = times[i];
    const details = typeof item.details === "string" ? item.details.trim() : "";

    const rawQty = typeof item.quantity === "number" && isFinite(item.quantity) ? item.quantity : 0;
    const quantity = rawQty <= 0 ? QUANTITY_FALLBACK_G : Math.round(rawQty);

    const normalizedName = normalizeForEmbedding(item.name);
    const logBase = {
      requestId,
      phrase,
      originalName: item.name,
      llmNote: details,
      llmQuantity: typeof item.quantity === "number" ? item.quantity : null,
      llmTime: typeof item.time === "string" ? item.time : null,
      normalizedName,
      matcherVersion: MATCHER_VERSION,
      llmModel,
    } as const;

    const alias = lookupAlias(item.name);
    if (alias) {
      logMatcherQuery({
        ...logBase,
        verdict: "alias",
        top: [{ id: alias.id, name: alias.name, score: alias.score }],
        margin: null,
        aliasHit: true,
      });
      resolved.push({
        productId: alias.id,
        name: alias.name,
        originalName: item.name,
        details,
        quantity,
        time,
        confidence: alias.score,
      });
      continue;
    }

    // Embedding/matcher failure on ONE ingredient must not sink the whole
    // recipe — resolveNames runs matchOne per name (a 15-item dish = 15 calls),
    // so one throw would 500 the entire suggestion. Degrade just this item to
    // unresolved; the user still gets every other ingredient.
    let candidates: MatchCandidate[];
    try {
      candidates = await matchOne(item.name, 3);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      logMatcherQuery({
        ...logBase,
        verdict: "unresolved",
        top: [],
        margin: null,
        aliasHit: false,
      });
      console.error(`resolveNames: matchOne failed for "${item.name}": ${reason}`);
      unresolved.push({ originalName: item.name, details, quantity, time });
      continue;
    }
    const top = candidates[0];
    const second = candidates[1];

    if (!top) {
      logMatcherQuery({
        ...logBase,
        verdict: "unresolved",
        top: [],
        margin: null,
        aliasHit: false,
      });
      unresolved.push({
        originalName: item.name,
        details,
        quantity,
        time,
      });
      continue;
    }

    const margin = second ? top.score - second.score : 1;
    const aboveFloor = top.score >= SCORE_FLOOR;
    const confident = aboveFloor && margin >= AUTO_ACCEPT_MARGIN;

    const verdict: "resolved" | "ambiguous" | "unresolved" = confident
      ? "resolved"
      : aboveFloor
        ? "ambiguous"
        : "unresolved";

    const scoreBreakdown =
      top.trigram !== undefined || top.cosine !== undefined || top.hybrid !== undefined
        ? {
            ...(top.trigram !== undefined ? { trigram: top.trigram } : {}),
            ...(top.cosine !== undefined ? { cosine: top.cosine } : {}),
            ...(top.hybrid !== undefined ? { hybrid: top.hybrid } : {}),
          }
        : undefined;

    logMatcherQuery({
      ...logBase,
      verdict,
      top: candidates.map((c) => ({ id: c.id, name: c.name, score: c.score })),
      margin,
      aliasHit: false,
      ...(scoreBreakdown ? { scoreBreakdown } : {}),
    });

    if (verdict === "resolved") {
      resolved.push({
        productId: top.id,
        name: top.name,
        originalName: item.name,
        details,
        quantity,
        time,
        confidence: top.score,
      });
    } else if (verdict === "ambiguous") {
      ambiguous.push({
        originalName: item.name,
        details,
        quantity,
        time,
        candidates,
      });
    } else {
      unresolved.push({
        originalName: item.name,
        details,
        quantity,
        time,
      });
    }
  }

  return { requestId, resolved, ambiguous, unresolved };
}
