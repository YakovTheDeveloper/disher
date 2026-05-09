import { pool } from "../db.js";
import {
  ANALYSIS_OUTPUT_PROMPT_SPEC,
  SYSTEM_PROMPT_BASE,
  safeStringifyArray,
  stripNullBytes,
  tryParseOutput,
  type AnalysisOutput,
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

const FAILURE_PREFIX = "⚠️ Анализ не удался";

export type HypothesisContext = {
  title: string;
  body: string;
  days?: number | null;
  startedAt: string;
};

export type AnalyzePayload = {
  windowStart: string;
  windowEnd: string;
  scheduleFoods: unknown[];
  scheduleEvents: unknown[];
  hypotheses?: HypothesisContext[];
};

export type CallLLMOptions = {
  signal: AbortSignal;
};

export type CallLLM = (
  systemPrompt: string,
  userPrompt: string,
  options: CallLLMOptions,
) => Promise<string>;

export { SYSTEM_PROMPT_BASE, ANALYSIS_OUTPUT_PROMPT_SPEC };

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

  if (payload.hypotheses && payload.hypotheses.length > 0) {
    const safe = payload.hypotheses.map((h) => ({
      ...h,
      title: h.title.replace(/<\/?active_hypotheses>/g, ""),
      body: h.body.replace(/<\/?active_hypotheses>/g, ""),
    }));
    const wrapped = safeStringifyArray(safe, HYPOTHESES_BUDGET);
    lines.push("");
    lines.push(
      "Юзер сейчас тестирует следующие гипотезы — учти их в разборе и не предлагай дубли:",
    );
    lines.push("<active_hypotheses>");
    lines.push(wrapped.json);
    lines.push("</active_hypotheses>");
  }

  return lines.join("\n");
}

async function fetchLLMOnce(
  systemPrompt: string,
  userPrompt: string,
  options: CallLLMOptions,
): Promise<string> {
  const { signal } = options;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");
  const model = process.env.SUGGESTION_MODEL ?? "deepseek/deepseek-chat";

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
  payload: AnalyzePayload,
  callLLM: CallLLM = fetchLLMOnce,
): Promise<void> {
  if (!pool) throw new Error("DB pool not initialised");

  const signal = AbortSignal.timeout(LLM_TIMEOUT_MS);
  const userPrompt = buildUserPrompt(payload);

  try {
    const result = await callLLMWithValidation(
      SYSTEM_PROMPT_BASE,
      userPrompt,
      signal,
      callLLM,
    );
    await pool.query(
      `update public.analyses
       set result_md = $1, idea_cards = $2::jsonb
       where id = $3::uuid and result_md = ''`,
      [result.resultMd, JSON.stringify(result.ideaCards), analysisId],
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
         set result_md = $1, idea_cards = '[]'::jsonb
         where id = $2::uuid and result_md = ''`,
        [`${FAILURE_PREFIX}: ${reason.slice(0, 500)}`, analysisId],
      )
      .catch(() => {});
  }
}

export async function updateAnalysisFailed(
  analysisId: string,
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
}
