import type { FastifyInstance } from "fastify";
import { requireUser } from "../../auth/require-user.js";
import { applySSECorsHeaders } from "../lib/sse-cors.js";
import { chargeOr402, resolveRequestId } from "../../billing/http.js";
import { refund } from "../../billing/wallet.js";

// POST /api/analyze-dish — SSE stream. The frontend hydrates the dish payload
// from Dexie + catalog and posts it; the backend forwards the OpenRouter
// chat-completions stream verbatim (no Postgres row, no idempotency key, no
// polling endpoint). Result is persisted on the client in idb-keyval under
// `dish-analysis:<dishId>`. Re-run = re-post = overwrite.
//
// Why no Postgres: a per-dish analysis is cheap and the result lives next to
// the dish (UI is a screen of DishBuilderPage). No cross-device history is
// owed to the user, and the latest backup snapshot already carries the dish
// itself — losing an analysis on device swap is acceptable.
//
// Output contract: plain markdown chunks (no `response_format: json_object`,
// no idea_cards). Format mirrors apps/disher-backend-3.0/src/api/routes/
// analytics.ts streamFromLLM, which the schedule-analytics page already
// consumes via parseSSELines.

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

const MODEL = "deepseek/deepseek-chat";

const SYSTEM_PROMPT = `Ты — нутрициолог-аналитик. На вход — рецепт одного блюда (название, общий вес,
список ингредиентов с граммовкой и необязательной заметкой по способу готовки).

Задача: дать короткий разбор-описание блюда в Markdown. Не калькулятор и не диагноз.
Корреляции и качественные характеристики, не точные цифры.

Структура ответа:
- Профиль БЖУ — кратко: что преобладает, что дефицитно.
- Гликемическая характеристика — быстрые/медленные углеводы, ощущение после еды.
- Для каких целей хорош — кому/когда это блюдо уместно (тренировка, ужин, восстановление…).
- Что добавить или заменить — 1-3 конкретные идеи для апгрейда (источник клетчатки,
  жиров, замена готовки и т.п.).

Пиши на русском, лаконично, дружелюбно. Без медицинских советов и без выдумывания
симптомов. Если данных мало — так и скажи. Markdown, без оборачивания в код-фенс.`;

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

async function streamDishAnalysis(
  userPrompt: string,
  reply: any,
): Promise<{ producedOutput: boolean }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    reply.status(500).send({ error: "OPENROUTER_API_KEY not set" });
    return { producedOutput: false };
  }

  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  let response: Response;
  try {
    response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          stream: true,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        }),
      },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    reply.raw.write(
      `event: error\ndata: ${JSON.stringify(`fetch failed: ${msg}`)}\n\n`,
    );
    reply.raw.end();
    return { producedOutput: false };
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    reply.raw.write(
      `event: error\ndata: ${JSON.stringify(`OpenRouter ${response.status}: ${text.slice(0, 200)}`)}\n\n`,
    );
    reply.raw.end();
    return { producedOutput: false };
  }

  const reader = response.body?.getReader();
  if (!reader) {
    reply.raw.write(
      `event: error\ndata: ${JSON.stringify("no response body")}\n\n`,
    );
    reply.raw.end();
    return { producedOutput: false };
  }

  // producedOutput drives the refund decision: a failure before any frame
  // reaches the client refunds; once content has streamed, the user got value.
  let producedOutput = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      producedOutput = true;
      reply.raw.write(value);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    reply.raw.write(
      `event: error\ndata: ${JSON.stringify(`stream aborted: ${msg}`)}\n\n`,
    );
  } finally {
    reply.raw.write("data: [DONE]\n\n");
    reply.raw.end();
  }
  return { producedOutput };
}

type AnalyzeDishRouteOptions = {
  /** Test-only: replace the OpenRouter call with a stub that writes SSE
   *  frames directly to the reply. The handler still owns the response head;
   *  the stub should only write `data: ...\n\n` lines and not call end().
   *  Return `{ producedOutput: false }` to simulate a pre-content failure
   *  (which refunds); omit/return void to count as having produced output. */
  streamLLM?: (
    userPrompt: string,
    reply: any,
  ) => Promise<void | { producedOutput?: boolean }>;
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

    // Paid: debit before opening the SSE stream so an insufficient-balance 402
    // is a clean JSON reply (the raw socket is still untouched here).
    const requestId = resolveRequestId(req);
    if (!(await chargeOr402(req, reply, "dish_analysis", requestId))) return;

    // SSE streams reply.raw directly — @fastify/cors only writes Access-Control-*
    // through reply.send(), so for raw-socket responses we have to seed those
    // headers ourselves before writeHead().
    applySSECorsHeaders(reply.raw, req.headers.origin);

    const userPrompt = buildDishUserPrompt(dishName, totalGrams, ingredients);

    let producedOutput: boolean;
    if (opts.streamLLM) {
      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      try {
        const r = await opts.streamLLM(userPrompt, reply);
        producedOutput = r?.producedOutput ?? true;
      } finally {
        reply.raw.write("data: [DONE]\n\n");
        reply.raw.end();
      }
    } else {
      ({ producedOutput } = await streamDishAnalysis(userPrompt, reply));
    }

    // Refund if the stream failed before any content reached the client.
    if (!producedOutput) {
      await refund(req.userId, "dish_analysis", requestId).catch(() => {});
    }
  });
}
