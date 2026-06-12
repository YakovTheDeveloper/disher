// Single source of truth for the LLM analysis contract — prompt spec + output
// type + parser. Every place that touches the LLM JSON contract imports from
// here. Drift between prompt and parser is the bug class this module exists
// to prevent (Bugs 12, 13, 18, 22, 23 in the original review).
//
// Frontend reads `idea_cards` jsonb via mapAnalysisRow + asIdeaCards in
// food-calc/src/entities/analysis/api/mappers.ts. The frontend mapper is
// permissive (drops malformed cards, defaults missing fields) — keep the
// IdeaCard shape here and the asIdeaCards filter in sync.

// ─── Output entities ───
// Two distinct things the analysis emits, deliberately NOT one bucket:
//   • insight    — read-only observation grounded in the actual window data
//                  (evidence.days is mandatory — the anti-hallucination lever).
//   • hypothesis — a testable mini-experiment the user can save to themselves
//                  (this is the former `ideaCard`, renamed to its real meaning).
// `summary` is a 1–2 sentence overview persisted into analyses.result_md so the
// existing pending('')/failed('⚠️…') sentinels on that column keep working.

export type AnalysisStrength = "weak" | "moderate" | "clear";

export type AnalysisEvidence = {
  days: string[]; // concrete day keys from the window — non-empty for an insight
  foods?: string[];
  events?: string[];
};

export type AnalysisInsight = {
  title: string;
  detail: string;
  strength: AnalysisStrength;
  evidence: AnalysisEvidence;
};

export type AnalysisHypothesis = {
  title: string;
  body: string;
  suggestedDays?: number;
};

export type AnalysisOutput = {
  summary: string;
  insights: AnalysisInsight[];
  hypotheses: AnalysisHypothesis[];
};

// Inline JSON contract embedded in the system prompt. Whatever this string
// describes is what tryParseOutput expects to receive — both sides must move
// together. The contract test feeds historical / fixture LLM responses into
// tryParseOutput so a prompt change that breaks the parser fails CI.
export const ANALYSIS_OUTPUT_PROMPT_SPEC = `Верни строго JSON и НИЧЕГО кроме JSON:
{
  "summary": "1–2 фразы: общая картина окна простым языком. Без диагнозов.",
  "insights": [
    {
      "title": "Короткий заголовок наблюдения",
      "detail": "Что именно замечено, одним-двумя предложениями.",
      "strength": "weak | moderate | clear",
      "evidence": {
        "days": ["09-06-2026", "10-06-2026"],
        "foods": ["паста карбонара"],
        "events": ["усталость"]
      }
    }
  ],
  "hypotheses": [
    { "title": "Короткое название гипотезы", "body": "почему стоит проверить и как тестировать", "suggestedDays": 7 }
  ]
}

Правила:
- summary — всегда непустой. Если данных мало для выводов — так и напиши в summary, а insights/hypotheses оставь пустыми.
- insights — 0–4 наблюдения. Это то, что ты УВИДЕЛ в данных, не совет. У КАЖДОГО insight поле evidence.days ОБЯЗАТЕЛЬНО и непусто — это реальные дни окна, на которых построено наблюдение. foods/events — опционально, ключевые еда/события. Нет опоры в данных — не выдумывай наблюдение.
- strength: "clear" только при явном повторе (примерно ≥40% дней окна или сильная связка), единичное совпадение — "weak", промежуточное — "moderate".
- hypotheses — 0–3 независимые, каждая как мини-эксперимент: что проверить и как. suggestedDays — опциональное рекомендованное окно проверки в днях.
- Без медицинских советов и диагнозов нигде. Без комментариев и markdown-заборов вокруг JSON.`;

// Each schedule_food carries a `details` string — comma-separated free-text
// tags the user attached to the meal (способ готовки, выдержка, источник,
// маринад, кожура, …). The cohort-building paragraph below tells the LLM how
// to mine it. Single-mention tokens are not patterns — we want at least ~20%
// of days in the window before calling something a cohort.
const DETAILS_COHORT_INSTRUCTION = `Каждый приём пищи может иметь поле details (строка через запятую: «жареное, без масла», «выдержанный», «домашнее», «с кожурой» и т.п.). Прочти details всех приёмов окна. Выдели повторяющиеся оси (способ готовки, источник, выдержка, кожура, маринад) и стройте когорты — например «жареные дни» vs «варёные дни», «домашнее» vs «магазинное». Минимум для когорты — присутствие в ≥20% дней окна; единичные упоминания не паттерн. Если ось встречается слишком редко, не натягивай её на разбор.`;

// Events arrive as JSON: each has `text` (free-form description of how the user
// felt / what they noted) and optionally `atoms` — currently scale ratings
// (`{kind:"scale", value:1–10, label:"Боль"}`). The user writes the phenomenon
// AND often its suspected cause directly into `text`; the model must mine that
// prose, cluster it across days, and treat user-stated causes as hypotheses —
// not facts. This is the events-side mirror of DETAILS_COHORT_INSTRUCTION; it
// exists because events used to be dumped as raw JSON with no reading guidance.
const EVENTS_MINING_INSTRUCTION = `События юзера приходят с полем text (свободное описание самочувствия/состояния) и иногда с атомами-оценками (шкала 1–10 с ярлыком явления, напр. «Боль» 7/10). Прочти text всех событий окна. Кластеризуй повторяющиеся явления, даже если в разные дни они названы по-разному («болит голова» ≈ «мигрень» ≈ «тяжёлая голова») — для корреляции это один ряд. В тексте юзер часто сам называет предполагаемую причину («болела голова из-за недосыпа», «бодрость после кофе») — это ГИПОТЕЗА юзера, а не факт: взвешивай её против реальной еды окна, не принимай на веру и не повторяй как готовый вывод. Шкальные оценки — это сила явления: учитывай величину (7/10 vs 3/10), а не только факт, что событие было. Минимум для паттерна — повтор примерно в ≥20% дней окна; единичное явление не паттерн.`;

// ─── Nutrient anchor ───
// The client computes approximate per-day nutrient sums (from the catalog) and
// ships them as an anchor. They are NOT a calculator readout for the user — the
// instruction below tells the LLM to treat them as rough calibration only.

export type NutrientLine = {
  name: string;
  amount: number;
  unit: string;
  norm: number | null;
};

// Coerce arbitrary client JSON into NutrientLine[]. Permissive: drops malformed
// entries rather than throwing, mirrors the rest of this module's contract.
export function asNutrientLines(v: unknown): NutrientLine[] {
  if (!Array.isArray(v)) return [];
  const out: NutrientLine[] = [];
  for (const item of v) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (typeof o.name !== "string") continue;
    if (typeof o.amount !== "number" || !Number.isFinite(o.amount)) continue;
    const unit = typeof o.unit === "string" ? o.unit : "";
    const norm =
      typeof o.norm === "number" && Number.isFinite(o.norm) ? o.norm : null;
    out.push({ name: o.name, amount: o.amount, unit, norm });
  }
  return out;
}

// One nutrient → a compact token, e.g. «Белки 95 г (норма ~51)». Used inline
// (long, per-day) and as bullets (daily).
export function nutrientLineToken(n: NutrientLine): string {
  const base = `${n.name} ${n.amount} ${n.unit}`.trim();
  return n.norm !== null ? `${base} (норма ~${n.norm})` : base;
}

export const NUTRIENT_ANCHOR_INSTRUCTION = `К данным приложены ОРИЕНТИРОВОЧНЫЕ суммы нутриентов за день — посчитаны автоматически из каталога по съеденным продуктам и порциям. Они приблизительные: часть продуктов может быть без данных, состав и порции варьируются. Используй их ТОЛЬКО как опору: грубо прикинуть, чего за день могло быть заметно мало или много относительно ориентира суточной нормы, и не предлагать абсурдных количеств. НЕ зачитывай эти числа юзеру как точные и НЕ превращай ответ в таблицу БЖУ — говори о тенденциях («белка в эти дни заметно ниже ориентира»), а не «у вас было ровно 73.4 г белка». Если по нутриентам данных нет — просто не упоминай их.`;

// Dish names may carry a bracket-tag with per-ingredient modifications, e.g.
// `Борщ [особенности: свёкла печёная, говядина тушёная 2ч]`. This is the
// dish's own «recipe variation», not a tag on the meal — treat it as part
// of what the dish *is* on that day.
export const DISH_DETAILS_INSTRUCTION = `Если имя блюда содержит хвост вида «[особенности: …]», это перечень модификаций ингредиентов в этом конкретном приготовлении блюда (способ готовки, замена, выдержка). Учитывай их как составную часть блюда, а не как отдельные теги приёма.`;

export const SYSTEM_PROMPT_BASE = `Ты помогаешь юзеру в его персональной лаборатории еды и симптомов.
На вход — события юзера за окно (приёмы пищи + теги/события) и, опционально,
гипотезы, которые юзер хочет проверить. Задача: на русском дать короткий summary,
наблюдения (insights) — то, что реально видно в данных окна, и гипотезы
(hypotheses) — что юзеру стоит проверить дальше. Ты ищешь корреляции, а не
ставишь диагнозы и не считаешь калькулятор БЖУ.

${DETAILS_COHORT_INSTRUCTION}

${EVENTS_MINING_INSTRUCTION}

${DISH_DETAILS_INSTRUCTION}

${NUTRIENT_ANCHOR_INSTRUCTION}

${ANALYSIS_OUTPUT_PROMPT_SPEC}`;

// Coerce a free-form value into a string[] (drop non-strings, trim, drop empties).
function asStringList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== "string") continue;
    const s = item.trim();
    if (s) out.push(s);
  }
  return out;
}

// Permissive insight coercion. The grounding contract is enforced HERE, not
// only in the prompt: an insight whose evidence.days is empty is DROPPED — a
// pattern with no days behind it is exactly the hallucination this feature
// exists to suppress. Unknown strength coerces to "weak" rather than dropping
// the whole observation.
function asInsights(v: unknown): AnalysisInsight[] {
  if (!Array.isArray(v)) return [];
  const out: AnalysisInsight[] = [];
  for (const c of v) {
    if (!c || typeof c !== "object" || Array.isArray(c)) continue;
    const o = c as Record<string, unknown>;
    if (typeof o.title !== "string" || typeof o.detail !== "string") continue;
    const ev = (o.evidence ?? {}) as Record<string, unknown>;
    const days = asStringList(ev.days);
    if (days.length === 0) continue; // grounding gate — no days, no insight
    const strength: AnalysisStrength =
      o.strength === "clear" || o.strength === "moderate" ? o.strength : "weak";
    const insight: AnalysisInsight = {
      title: o.title,
      detail: o.detail,
      strength,
      evidence: { days },
    };
    const foods = asStringList(ev.foods);
    if (foods.length > 0) insight.evidence.foods = foods;
    const events = asStringList(ev.events);
    if (events.length > 0) insight.evidence.events = events;
    out.push(insight);
  }
  return out;
}

// Permissive hypothesis coercion (the former ideaCard). title+body required;
// suggestedDays kept only when a positive finite number.
function asHypotheses(v: unknown): AnalysisHypothesis[] {
  if (!Array.isArray(v)) return [];
  const out: AnalysisHypothesis[] = [];
  for (const c of v) {
    if (!c || typeof c !== "object" || Array.isArray(c)) continue;
    const o = c as Record<string, unknown>;
    if (typeof o.title !== "string" || typeof o.body !== "string") continue;
    const h: AnalysisHypothesis = { title: o.title, body: o.body };
    if (
      typeof o.suggestedDays === "number" &&
      Number.isFinite(o.suggestedDays) &&
      o.suggestedDays > 0
    ) {
      h.suggestedDays = o.suggestedDays;
    }
    out.push(h);
  }
  return out;
}

// Permissive parser. LLM occasionally:
//  - wraps JSON in ```json ... ``` markdown fence (despite system prompt)
//  - emits trailing commentary after closing brace
//  - returns insights/hypotheses with extra fields, missing strength, etc.
//
// Contract: returns null only if structurally unsalvageable (no string
// summary). Returns a well-typed AnalysisOutput otherwise — malformed entries
// are dropped, not turned into runtime crashes downstream.
export function tryParseOutput(content: string): AnalysisOutput | null {
  let jsonStr = content.trim();

  // Strip markdown fence: ```json {...} ``` or ``` {...} ```. Match the
  // first fence — if there are multiple, the LLM is broken anyway.
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  // Trailing commentary: find the outermost JSON object by counting braces.
  // If the LLM emitted `{...}\n\nдополнительно: ...` we still parse cleanly.
  if (jsonStr.startsWith('{')) {
    let depth = 0;
    let inString = false;
    let escape = false;
    let endIdx = -1;
    for (let i = 0; i < jsonStr.length; i++) {
      const ch = jsonStr[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) { endIdx = i + 1; break; }
      }
    }
    if (endIdx > 0) jsonStr = jsonStr.slice(0, endIdx);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.summary !== 'string') return null;

  return {
    summary: obj.summary,
    insights: asInsights(obj.insights),
    hypotheses: asHypotheses(obj.hypotheses),
  };
}

// Safe array truncation for prompt payload. Replaces the old
// `JSON.stringify(arr).slice(0, N)` pattern that produced invalid JSON
// (truncated mid-string → LLM sees garbage).
//
// Strategy: stringify each element, accumulate until the budget would be
// exceeded, return the prefix array as a valid JSON string. Items are
// dropped from the END (most recent kept if `keepEnd` is true).
//
// Returns the JSON string + dropped count for prompt-side disclosure.
export function safeStringifyArray(
  arr: readonly unknown[],
  byteBudget: number,
  opts: { keepEnd?: boolean } = {},
): { json: string; kept: number; dropped: number } {
  if (arr.length === 0) return { json: '[]', kept: 0, dropped: 0 };
  if (byteBudget < 4) return { json: '[]', kept: 0, dropped: arr.length };

  // Encode all items once.
  const encoded: string[] = [];
  for (const item of arr) {
    try {
      encoded.push(JSON.stringify(item));
    } catch {
      encoded.push('null');
    }
  }

  // Greedy fill from the chosen end. `[`, `]`, and `,` separators count.
  // Budget = 2 (brackets) + sum(item) + (count - 1) for separators.
  const indices = opts.keepEnd
    ? Array.from({ length: encoded.length }, (_, i) => encoded.length - 1 - i)
    : Array.from({ length: encoded.length }, (_, i) => i);

  let used = 2; // brackets
  const taken: number[] = [];
  for (const idx of indices) {
    const sep = taken.length === 0 ? 0 : 1;
    const cost = encoded[idx].length + sep;
    if (used + cost > byteBudget) break;
    used += cost;
    taken.push(idx);
  }
  taken.sort((a, b) => a - b);

  const json = '[' + taken.map((i) => encoded[i]).join(',') + ']';
  return { json, kept: taken.length, dropped: arr.length - taken.length };
}

// Strip null bytes that Postgres text columns reject (Bug 36). LLM and user
// free-text can both emit ` ` — pg-protocol wraps it in a 22021 error.
// Apply at the boundary just before serialising to JSON for the prompt and
// before persisting LLM output.
const NULL_BYTE = ' ';
export function stripNullBytes<T>(value: T): T {
  if (typeof value === 'string') {
    return value.split(NULL_BYTE).join('') as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => stripNullBytes(v)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = stripNullBytes(v);
    }
    return out as unknown as T;
  }
  return value;
}
