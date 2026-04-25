import { FastifyInstance } from "fastify";
import { verifySupabaseUser } from "../supabase-auth.js";
import {
  getDailyAnalysis,
  upsertDailyAnalysis,
  getWeeklyAnalysis,
  upsertWeeklyAnalysis,
  getDailyAnalysesForWeek,
} from "../analytics-db.js";

// ─── Types ───

interface ScheduleFoodItem {
  time: string;
  type: "food" | "dish";
  name: string;
  quantity: number;
  items?: Array<{ name: string; quantity: number }>; // dish sub-items
}

interface ScheduleEventItem {
  time: string;
  text: string;
  atoms: Array<{
    kind: string;
    value?: number | string;
    label?: string;
    unit?: string;
    start?: number;
    end?: number;
    durationMin?: number;
    points?: Array<{ x: number; y: number; side: string }>;
  }>;
}

interface DailyAnalyzeRequest {
  tab: "food" | "day";
  foods: ScheduleFoodItem[];
  events?: ScheduleEventItem[];
  inputHash: string;
}

interface WeeklyAnalyzeRequest {
  dates: string[];
}

// ─── Formatting ───

function formatScheduleForPrompt(foods: ScheduleFoodItem[]): string {
  return foods
    .map((item) => {
      const base = `${item.time} — ${item.name} (${item.quantity}г)`;
      if (item.type === "dish" && item.items?.length) {
        const sub = item.items
          .map((i) => `    • ${i.name}: ${i.quantity}г`)
          .join("\n");
        return `${base}\n${sub}`;
      }
      return base;
    })
    .join("\n");
}

function formatEventsForPrompt(events: ScheduleEventItem[]): string {
  return events
    .map((event) => {
      const atoms = event.atoms
        .map((a) => {
          switch (a.kind) {
            case "scale":
              return `${a.label || "оценка"}: ${a.value}/10`;
            case "number":
              return `${a.label || "значение"}: ${a.value}${a.unit ? ` ${a.unit}` : ""}`;
            case "time":
              return `длительность: ${a.durationMin ? `${a.durationMin} мин` : `${a.start ?? "?"}-${a.end ?? "?"}`}`;
            case "tag":
              return `тег: ${a.value}`;
            case "flag":
              return `флаг: ${a.value}`;
            case "body":
              return `область тела: ${a.label || "отмечено"}`;
            default:
              return null;
          }
        })
        .filter(Boolean)
        .join(", ");
      const base = `${event.time} — ${event.text}`;
      return atoms ? `${base} (${atoms})` : base;
    })
    .join("\n");
}

const MODEL = "deepseek/deepseek-chat";

const SYSTEM_PROMPT = `Ты — профессиональный нутрициолог-диетолог.
Проанализируй дневной рацион пользователя.
Дай краткий, конкретный анализ:
1. Общая оценка дня (хорошо / нормально / плохо)
2. Что хорошо
3. Что стоит улучшить
4. Конкретные рекомендации
Отвечай на русском. Будь лаконичен.`;

const SYSTEM_PROMPT_DAY = `Ты — профессиональный нутрициолог-диетолог и специалист по здоровому образу жизни.
Проанализируй дневной рацион пользователя вместе с событиями дня (самочувствие, активность, симптомы и т.д.).
Найди связи между питанием и событиями/состояниями. Дай краткий, конкретный анализ:
1. Общая оценка дня (хорошо / нормально / плохо)
2. Связи между едой и событиями/самочувствием
3. Что хорошо
4. Что стоит улучшить
5. Конкретные рекомендации
Отвечай на русском. Будь лаконичен.`;

const SYSTEM_PROMPT_WEEKLY = `Ты — профессиональный нутрициолог-диетолог.
Тебе даны ежедневные анализы питания пользователя за неделю.
Составь недельный обзор:
1. Общая оценка недели (хорошо / нормально / плохо)
2. Тенденции и паттерны питания
3. Стабильность рациона (регулярность, разнообразие)
4. Что хорошо на уровне недели
5. Что стоит улучшить
6. 3 конкретные рекомендации на следующую неделю
Отвечай на русском. Будь лаконичен, но информативен.`;

// ─── LLM Streaming Helper ───

async function streamFromLLM(
  systemPrompt: string,
  userMessage: string,
  reply: any,
  onComplete?: (fullText: string) => void
): Promise<void> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    reply.status(500).send({ error: "OPENROUTER_API_KEY not set" });
    return;
  }

  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  const response = await fetch(
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
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    }
  );

  const reader = response.body?.getReader();
  if (!reader) {
    reply.raw.end();
    return;
  }

  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    reply.raw.write(chunk);

    // Parse SSE chunks to accumulate full text for persistence
    const lines = chunk.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6);
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) fullText += content;
      } catch {
        // skip malformed
      }
    }
  }

  reply.raw.write("data: [DONE]\n\n");
  reply.raw.end();

  if (onComplete && fullText) {
    onComplete(fullText);
  }
}

// ─── Routes ───

export async function analyticsRoutes(app: FastifyInstance) {
  // ─── V2 endpoints (Supabase JWT auth) ───
  // Cache is keyed by the user's Supabase UUID. Both anonymous and permanent
  // users get a stable per-account `sub`, so analyses cannot leak across
  // accounts that happen to produce the same `inputHash`.

  // GET /api/analytics/v2/daily/:date?tab=food|day
  app.get<{ Params: { date: string }; Querystring: { tab?: string } }>(
    "/v2/daily/:date",
    async (req, reply) => {
      const userId = await verifySupabaseUser(req, reply);
      if (!userId) return;

      const tab = req.query.tab || "food";
      const analysis = getDailyAnalysis(userId, req.params.date, tab);
      if (!analysis) {
        return reply.status(404).send({ error: "No analysis found" });
      }
      return {
        content: analysis.content,
        inputHash: analysis.input_hash,
        date: analysis.date,
        tab: analysis.tab,
        createdAt: analysis.created_at,
      };
    }
  );

  // POST /api/analytics/v2/daily/:date
  app.post<{ Params: { date: string }; Body: DailyAnalyzeRequest }>(
    "/v2/daily/:date",
    async (req, reply) => {
      try {
        const userId = await verifySupabaseUser(req, reply);
        if (!userId) return;

        const { tab, foods, events, inputHash } = req.body;
        const date = req.params.date;

        const existing = getDailyAnalysis(userId, date, tab);
        if (existing && existing.input_hash === inputHash) {
          return reply.send({
            content: existing.content,
            inputHash: existing.input_hash,
            cached: true,
          });
        }

        const isDay = tab === "day";
        const foodsFormatted = formatScheduleForPrompt(foods);
        let userMessage: string;

        if (isDay) {
          const eventsFormatted = formatEventsForPrompt(events || []);
          userMessage = `День: ${date}\n\n`;
          if (foods.length > 0) userMessage += `Рацион:\n${foodsFormatted}\n\n`;
          if (events && events.length > 0)
            userMessage += `События дня:\n${eventsFormatted}`;
        } else {
          userMessage = `Рацион за ${date}:\n${foodsFormatted}`;
        }

        const systemPrompt = isDay ? SYSTEM_PROMPT_DAY : SYSTEM_PROMPT;

        await streamFromLLM(systemPrompt, userMessage, reply, (fullText) => {
          upsertDailyAnalysis(userId, date, tab, fullText, inputHash, MODEL);
        });
      } catch (err) {
        console.error("POST /v2/daily/:date error:", err);
        if (!reply.sent) reply.status(500).send({ error: String(err) });
      }
    }
  );

  // GET /api/analytics/v2/weekly/:weekStart
  app.get<{ Params: { weekStart: string } }>(
    "/v2/weekly/:weekStart",
    async (req, reply) => {
      const userId = await verifySupabaseUser(req, reply);
      if (!userId) return;

      const analysis = getWeeklyAnalysis(userId, req.params.weekStart);
      if (!analysis) {
        return reply.status(404).send({ error: "No weekly analysis found" });
      }
      return {
        content: analysis.content,
        dailyHashes: JSON.parse(analysis.daily_hashes),
        weekStart: analysis.week_start,
        createdAt: analysis.created_at,
      };
    }
  );

  // POST /api/analytics/v2/weekly/:weekStart
  app.post<{ Params: { weekStart: string }; Body: WeeklyAnalyzeRequest }>(
    "/v2/weekly/:weekStart",
    async (req, reply) => {
      try {
        const userId = await verifySupabaseUser(req, reply);
        if (!userId) return;

        const weekStart = req.params.weekStart;
        const { dates } = req.body;

        const dailyAnalyses = getDailyAnalysesForWeek(userId, dates);
        if (dailyAnalyses.length === 0) {
          return reply.status(400).send({
            error: "No daily analyses found for this week",
            missingDates: dates,
          });
        }

        const dailyHashes = dailyAnalyses.map((a) => a.input_hash);
        const existing = getWeeklyAnalysis(userId, weekStart);

        if (existing) {
          const storedHashes = JSON.parse(existing.daily_hashes) as string[];
          if (
            storedHashes.length === dailyHashes.length &&
            storedHashes.every((h, i) => h === dailyHashes[i])
          ) {
            return reply.send({
              content: existing.content,
              dailyHashes: storedHashes,
              cached: true,
            });
          }
        }

        const daysText = dailyAnalyses
          .map((a) => `### ${a.date}\n${a.content}`)
          .join("\n\n");

        const coveredDates = dailyAnalyses.map((a) => a.date);
        const missingDates = dates.filter((d) => !coveredDates.includes(d));

        let userMessage = `Ежедневные анализы за неделю (${weekStart}):\n\n${daysText}`;
        if (missingDates.length > 0) {
          userMessage += `\n\nПримечание: нет данных за: ${missingDates.join(", ")}`;
        }

        await streamFromLLM(
          SYSTEM_PROMPT_WEEKLY,
          userMessage,
          reply,
          (fullText) => {
            upsertWeeklyAnalysis(userId, weekStart, fullText, dailyHashes, MODEL);
          }
        );
      } catch (err) {
        console.error("POST /v2/weekly/:weekStart error:", err);
        if (!reply.sent) reply.status(500).send({ error: String(err) });
      }
    }
  );
}
