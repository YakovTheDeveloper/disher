import type { FastifyInstance } from "fastify";
import { requireUser } from "../../auth/require-user.js";
import { DISH_DETAILS_INSTRUCTION } from "../../shared/analysis-output.js";
import { applySSECorsHeaders } from "../lib/sse-cors.js";

// POST /api/analyze/daily — SSE stream. The "daily analysis" — a one-day
// review of the user's meals + health tags. The frontend hydrates the day's
// payload from Dexie + catalog (human-readable names, not product_id UUIDs)
// and posts it; the backend forwards the OpenRouter chat-completions stream.
//
// Why no Postgres row (unlike /api/analyze): a daily review is cheap and
// short, the client stays alive for the whole call, and the result is
// persisted client-side in idb-keyval keyed by date. Re-run = re-post =
// overwrite. No idempotency key, no polling endpoint.
//
// Output contract: plain markdown chunks (no `response_format: json_object`).
// The markdown tail may carry a `## Идеи для эксперимента` section that the
// client parses into idea-cards.
//
// Net-new vs analyze-dish.ts: client-disconnect abort. The dish endpoint
// reads the OpenRouter stream to completion even after the client leaves;
// here we wire `socket.on('close')` → AbortController so a disconnect stops
// burning LLM tokens. See the Fastify "Detecting When Clients Abort" guide.

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Model is env-driven (shared knob with the long analysis in runJob.ts) so it
// can be swapped without a code change. Read at call time, not module load.
const dailyModel = () => process.env.SUGGESTION_MODEL ?? "deepseek/deepseek-chat";

// System prompt is net-new — it does NOT reuse SYSTEM_PROMPT_BASE (that one
// carries a JSON output contract and a cohort-mining paragraph). A one-day
// window has no cross-day cohorts, so DETAILS_COHORT_INSTRUCTION is omitted;
// DISH_DETAILS_INSTRUCTION is included (the `[особенности: …]` bracket-tag
// rides in from the client's collectFoods hydration).
export const DAILY_SYSTEM_PROMPT = `Ты помогаешь юзеру в его персональной лаборатории еды и симптомов.
На вход — события юзера за ОДИН день (приёмы пищи + теги/события) и,
опционально, гипотезы, которые юзер хочет проверить.

Это разбор одного дня, не недельный. Паттернов между днями тут нет —
не выдумывай их. Смотри на то, что доступно внутри дня:
- последовательность «еда → самочувствие» по времени (что съедено до
  отмеченного симптома и за сколько часов);
- время приёмов пищи и промежутки между ними;
- состав дня в целом — что преобладало, чего не было;
- если юзер отметил гипотезы — соблюдалось ли это в еде дня.

Не превращай разбор в калькулятор БЖУ и не ставь диагнозов. Корреляции
и наблюдения, не точные цифры. Если день пустой или данных мало — так
и скажи, коротко.

${DISH_DETAILS_INSTRUCTION}

Пиши на русском, дружелюбно, лаконично (2–4 коротких абзаца). Markdown,
без оборачивания в код-фенс.

Заверши ответ блоком «## Идеи для эксперимента» — 0–3 буллета формата
\`- **Заголовок** — описание одним предложением\`. Если зацепиться не за
что — блок не пиши вовсе, идеи через силу не выдумывай.`;

type HypothesisInput = { title: string; body: string };

type AnalyzeDailyBody = {
  date?: unknown;
  scheduleFoods?: unknown;
  scheduleEvents?: unknown;
  hypotheses?: unknown;
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
): string {
  const lines: string[] = [];
  lines.push(`День: ${date || "(дата не указана)"}`);
  lines.push("");
  lines.push(`Приёмы пищи за день (${scheduleFoods.length}):`);
  lines.push(JSON.stringify(scheduleFoods));
  lines.push("");
  lines.push(`События и теги за день (${scheduleEvents.length}):`);
  lines.push(JSON.stringify(scheduleEvents));
  if (hypotheses.length > 0) {
    lines.push("");
    lines.push(
      "Гипотезы, которые юзер хочет проверить — посмотри, соблюдались ли они в еде дня:",
    );
    for (const h of hypotheses) {
      lines.push(`- ${h.title}: ${h.body}`);
    }
  }
  return lines.join("\n");
}

// ─── SSE plumbing ───

/** A write sink for SSE frames. Returns false when the socket is gone. */
export type SSEWrite = (data: string | Uint8Array) => boolean;

/** Streams the LLM response into `write`. Throws on any failure — the caller
 *  converts a throw into an `event: error` frame. */
export type DailyStreamFn = (
  userPrompt: string,
  write: SSEWrite,
  signal: AbortSignal,
) => Promise<void>;

async function streamFromOpenRouter(
  userPrompt: string,
  write: SSEWrite,
  signal: AbortSignal,
): Promise<void> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: dailyModel(),
      stream: true,
      messages: [
        { role: "system", content: DAILY_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`OpenRouter ${response.status}: ${text.slice(0, 200)}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("no response body");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    // Forward the OpenRouter SSE frames verbatim. Stop early if the client
    // socket is already gone (write returns false).
    if (!write(value)) break;
  }
}

type RawReply = {
  writeHead: (status: number, headers: Record<string, string>) => void;
  write: (data: string | Uint8Array) => boolean;
  end: () => void;
  writableEnded: boolean;
  destroyed: boolean;
};

type CloseEmitter = {
  on: (event: "close", cb: () => void) => void;
  off: (event: "close", cb: () => void) => void;
};

// Core handler — extracted from the route so the SSE contract and the
// client-disconnect abort wiring are unit-testable without Fastify, auth or
// OpenRouter. (Fastify.inject resolves the whole response at once and cannot
// model a mid-stream disconnect — see tds/home-and-analyses-ui.md critique.)
export async function runDailySSE(args: {
  userPrompt: string;
  raw: RawReply;
  socket: CloseEmitter;
  streamLLM: DailyStreamFn;
}): Promise<void> {
  const { userPrompt, raw, socket, streamLLM } = args;

  const ac = new AbortController();
  const onClose = () => ac.abort();
  socket.on("close", onClose);

  const canWrite = () => !raw.writableEnded && !raw.destroyed;
  const write: SSEWrite = (data) => {
    if (!canWrite()) return false;
    try {
      return raw.write(data);
    } catch {
      return false;
    }
  };

  if (canWrite()) {
    raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
  }

  try {
    await streamLLM(userPrompt, write, ac.signal);
  } catch (err) {
    // A throw is either an upstream failure or our own abort after the client
    // left. write() is no-op'd once the socket is gone, so this is safe.
    const msg = err instanceof Error ? err.message : String(err);
    write(`event: error\ndata: ${JSON.stringify(msg)}\n\n`);
  } finally {
    socket.off("close", onClose);
    // The terminal [DONE] + end() must also be guarded — after a disconnect
    // the socket is dead and a bare write/end would throw write-after-end.
    if (canWrite()) {
      write("data: [DONE]\n\n");
      try {
        raw.end();
      } catch {
        /* socket gone between the guard and end() — ignore */
      }
    }
  }
}

type AnalyzeDailyRouteOptions = {
  /** Test-only: replace the OpenRouter call with a stub. */
  streamLLM?: DailyStreamFn;
};

export async function analyzeDailyRoutes(
  app: FastifyInstance,
  opts: AnalyzeDailyRouteOptions = {},
) {
  app.addHook("preHandler", requireUser);
  const streamLLM = opts.streamLLM ?? streamFromOpenRouter;

  app.post("/analyze/daily", async (req, reply) => {
    const body = (req.body ?? {}) as AnalyzeDailyBody;
    const date = asString(body.date);
    const scheduleFoods = asArray(body.scheduleFoods);
    const scheduleEvents = asArray(body.scheduleEvents);
    const hypotheses = asHypotheses(body.hypotheses);

    if (!date.trim()) {
      return reply.status(400).send({ error: "date required" });
    }

    // Safety net behind the client gate: an empty day (no foods AND no events)
    // would only burn a tiny LLM call on a «день пустой» reply. A day with
    // food but no health events is still valid — only reject when both empty.
    if (scheduleFoods.length === 0 && scheduleEvents.length === 0) {
      return reply.status(400).send({ error: "empty day" });
    }

    // @fastify/cors writes Access-Control-* via reply.header(), which is only
    // flushed by reply.send(). SSE handlers stream through reply.raw and
    // bypass that path entirely — set the headers on the raw socket so they
    // survive writeHead() inside runDailySSE.
    applySSECorsHeaders(reply.raw, req.headers.origin);

    const userPrompt = buildDailyUserPrompt(
      date,
      scheduleFoods,
      scheduleEvents,
      hypotheses,
    );

    await runDailySSE({
      userPrompt,
      raw: reply.raw,
      socket: req.socket,
      streamLLM,
    });
  });
}
