import { FastifyInstance } from "fastify";

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

interface AnalyzeRequest {
  date: string;
  foods: ScheduleFoodItem[];
}

interface AnalyzeDayRequest {
  date: string;
  foods: ScheduleFoodItem[];
  events: ScheduleEventItem[];
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

// ─── Routes ───

export async function analyticsRoutes(app: FastifyInstance) {
  // POST /api/analytics/analyze — one-shot analysis
  app.post<{ Body: AnalyzeRequest }>("/analyze", async (req, reply) => {
    const { date, foods } = req.body;

    const formatted = formatScheduleForPrompt(foods);
    const userMessage = `Рацион за ${date}:\n${formatted}`;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return reply.status(500).send({ error: "OPENROUTER_API_KEY not set" });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "anthropic/claude-sonnet-4-20250514",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
        }),
      }
    );

    const data = await response.json();
    return { analysis: data.choices?.[0]?.message?.content ?? null };
  });

  // POST /api/analytics/analyze-stream — SSE streaming analysis
  app.post<{ Body: AnalyzeRequest }>(
    "/analyze-stream",
    async (req, reply) => {
      const { date, foods } = req.body;

      const formatted = formatScheduleForPrompt(foods);
      const userMessage = `Рацион за ${date}:\n${formatted}`;

      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return reply.status(500).send({ error: "OPENROUTER_API_KEY not set" });
      }

      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
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
            model: "anthropic/claude-sonnet-4-20250514",
            stream: true,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
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
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        reply.raw.write(chunk);
      }

      reply.raw.write("data: [DONE]\n\n");
      reply.raw.end();
    }
  );

  // POST /api/analytics/analyze-day-stream — SSE streaming analysis of food + events
  app.post<{ Body: AnalyzeDayRequest }>(
    "/analyze-day-stream",
    async (req, reply) => {
      const { date, foods, events } = req.body;

      const foodsFormatted = formatScheduleForPrompt(foods);
      const eventsFormatted = formatEventsForPrompt(events);

      let userMessage = `День: ${date}\n\n`;
      if (foods.length > 0) {
        userMessage += `Рацион:\n${foodsFormatted}\n\n`;
      }
      if (events.length > 0) {
        userMessage += `События дня:\n${eventsFormatted}`;
      }

      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return reply.status(500).send({ error: "OPENROUTER_API_KEY not set" });
      }

      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
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
            model: "anthropic/claude-sonnet-4-20250514",
            stream: true,
            messages: [
              { role: "system", content: SYSTEM_PROMPT_DAY },
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
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        reply.raw.write(chunk);
      }

      reply.raw.write("data: [DONE]\n\n");
      reply.raw.end();
    }
  );
}
