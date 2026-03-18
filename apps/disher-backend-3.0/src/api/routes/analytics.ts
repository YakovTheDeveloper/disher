import { FastifyInstance } from "fastify";

// ─── Types ───

interface ScheduleFoodItem {
  time: string;
  type: "food" | "dish";
  name: string;
  quantity: number;
  items?: Array<{ name: string; quantity: number }>; // dish sub-items
}

interface AnalyzeRequest {
  date: string;
  foods: ScheduleFoodItem[];
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

const SYSTEM_PROMPT = `Ты — профессиональный нутрициолог-диетолог.
Проанализируй дневной рацион пользователя.
Дай краткий, конкретный анализ:
1. Общая оценка дня (хорошо / нормально / плохо)
2. Что хорошо
3. Что стоит улучшить
4. Конкретные рекомендации
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
}
