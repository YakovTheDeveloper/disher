// Single source of truth for the LLM analysis contract — prompt spec + output
// type + parser. Every place that touches the LLM JSON contract imports from
// here. Drift between prompt and parser is the bug class this module exists
// to prevent (Bugs 12, 13, 18, 22, 23 in the original review).
//
// Frontend reads `idea_cards` jsonb via mapAnalysisRow + asIdeaCards in
// food-calc/src/entities/analysis/api/mappers.ts. The frontend mapper is
// permissive (drops malformed cards, defaults missing fields) — keep the
// IdeaCard shape here and the asIdeaCards filter in sync.

export type IdeaCard = {
  title: string;
  body: string;
  days?: number;
};

export type AnalysisOutput = {
  resultMd: string;
  ideaCards: IdeaCard[];
};

// Inline JSON contract embedded in the system prompt. Whatever this string
// describes is what tryParseOutput expects to receive — both sides must move
// together. The contract test feeds historical / fixture LLM responses into
// tryParseOutput so a prompt change that breaks the parser fails CI.
export const ANALYSIS_OUTPUT_PROMPT_SPEC = `Верни строго JSON и НИЧЕГО кроме JSON:
{
  "resultMd": "## ...текст разбора в Markdown...",
  "ideaCards": [
    { "title": "Короткое название идеи", "days": 7, "body": "почему эта идея, как тестировать" }
  ]
}

Правила:
- resultMd — Markdown, 2–4 коротких параграфа, можно списки. Без медицинских советов и диагнозов.
- ideaCards — 1–3 штуки. Каждая независима и формулируется как мини-эксперимент или наблюдение.
- Если данных мало для уверенных выводов — так и скажи в resultMd, идей дай меньше или ноль.
- Без комментариев и markdown-заборов вокруг JSON.`;

// Each schedule_food carries a `details` string — comma-separated free-text
// tags the user attached to the meal (способ готовки, выдержка, источник,
// маринад, кожура, …). The cohort-building paragraph below tells the LLM how
// to mine it. Single-mention tokens are not patterns — we want at least ~20%
// of days in the window before calling something a cohort.
const DETAILS_COHORT_INSTRUCTION = `Каждый приём пищи может иметь поле details (строка через запятую: «жареное, без масла», «выдержанный», «домашнее», «с кожурой» и т.п.). Прочти details всех приёмов окна. Выдели повторяющиеся оси (способ готовки, источник, выдержка, кожура, маринад) и стройте когорты — например «жареные дни» vs «варёные дни», «домашнее» vs «магазинное». Минимум для когорты — присутствие в ≥20% дней окна; единичные упоминания не паттерн. Если ось встречается слишком редко, не натягивай её на разбор.`;

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
гипотезы, которые юзер хочет проверить. Задача: дать связный
аналитический разбор на русском в формате Markdown и 1–3 гипотезы-наблюдения,
которые юзер потом сохранит к себе.

${DETAILS_COHORT_INSTRUCTION}

${DISH_DETAILS_INSTRUCTION}

${NUTRIENT_ANCHOR_INSTRUCTION}

${ANALYSIS_OUTPUT_PROMPT_SPEC}`;

// Permissive parser. LLM occasionally:
//  - wraps JSON in ```json ... ``` markdown fence (despite system prompt)
//  - emits trailing commentary after closing brace
//  - returns ideaCards with extra fields, missing days, or non-string title
//
// Contract: returns null only if structurally unsalvageable. Returns a
// well-typed AnalysisOutput otherwise — malformed cards are dropped, not
// turned into runtime crashes downstream.
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
  if (typeof obj.resultMd !== 'string') return null;

  const ideaCards: IdeaCard[] = [];
  if (Array.isArray(obj.ideaCards)) {
    for (const c of obj.ideaCards) {
      if (!c || typeof c !== 'object' || Array.isArray(c)) continue;
      const card = c as Record<string, unknown>;
      if (typeof card.title !== 'string' || typeof card.body !== 'string') continue;
      const out: IdeaCard = { title: card.title, body: card.body };
      if (typeof card.days === 'number' && Number.isFinite(card.days) && card.days > 0) {
        out.days = card.days;
      }
      ideaCards.push(out);
    }
  }

  return { resultMd: obj.resultMd, ideaCards };
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
