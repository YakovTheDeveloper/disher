import { FastifyInstance } from "fastify";
import { ScheduleFoodsSnapshotSchema, ScheduleFoodsSnapshot } from "./validation.js";
import { callOpenRouterStream } from "../../lib/openrouter.js";
import { prisma } from "../../client.js";

const SYSTEM_MESSAGE = `Ты - профессиональный диетолог-нутрициолог. Твоя задача - анализировать дневной рацион питания и давать рекомендации по его улучшению.

Правила:
1. Анализируй пищевую ценность каждого приема пищи
2. Обращай внимание на баланс белков, жиров и углеводов
3. Учитывай калорийность и распределение нутриентов в течение дня
4. Давай практические рекомендации по улучшению рациона
5. Отвечай на русском языке
6. Используй структурированный формат ответа с заголовками
7. Если данных недостаточно для полного анализа, укажи это`;

async function resolveNames(snapshot: ScheduleFoodsSnapshot) {
    const foodIds = snapshot.foods
        .filter((item) => item.contentProduct)
        .map((item) => Number(item.contentProduct!.foodId));

    const dishIds = snapshot.foods
        .filter((item) => item.contentDish)
        .map((item) => Number(item.contentDish!.dishId));

    const [foods, dishes] = await Promise.all([
        foodIds.length > 0
            ? prisma.food.findMany({ where: { id: { in: foodIds } }, select: { id: true, name: true } })
            : [],
        dishIds.length > 0
            ? prisma.dish.findMany({ where: { id: { in: dishIds } }, select: { id: true, name: true } })
            : [],
    ]);

    return {
        foodNames: new Map(foods.map((f) => [String(f.id), f.name])),
        dishNames: new Map(dishes.map((d) => [String(d.id), d.name])),
    };
}

function formatScheduleForPrompt(
    snapshot: ScheduleFoodsSnapshot,
    foodNames: Map<string, string>,
    dishNames: Map<string, string>
): string {
    const itemsList = snapshot.foods
        .map((item) => {
            if (item.contentProduct) {
                const name = foodNames.get(item.contentProduct.foodId) ?? `Продукт (ID: ${item.contentProduct.foodId})`;
                return `- ${item.time}: ${name}, количество: ${item.contentProduct.quantity}г`;
            }
            if (item.contentDish) {
                const name = dishNames.get(item.contentDish.dishId) ?? `Блюдо (ID: ${item.contentDish.dishId})`;
                return `- ${item.time}: ${name}, количество: ${item.contentDish.quantity}г`;
            }
            return "";
        })
        .filter(Boolean)
        .join("\n");

    return `Рацион питания (ID расписания: ${snapshot.id}):\n\n${itemsList || "Нет данных о продуктах"}`;
}

export function registerAnalyticsSSE(server: FastifyInstance) {
    server.post("/api/analytics/analyze-stream", async (request, reply) => {
        const body = request.body as { snapshot: unknown };
        const parsed = ScheduleFoodsSnapshotSchema.safeParse(body?.snapshot);

        if (!parsed.success) {
            return reply.status(400).send({ error: "Invalid input", details: parsed.error.issues });
        }

        const snapshot = parsed.data;
        const { foodNames, dishNames } = await resolveNames(snapshot);
        const scheduleData = formatScheduleForPrompt(snapshot, foodNames, dishNames);

        const userPrompt = `Проанализируй следующий дневной рацион питания и дай рекомендации:

${scheduleData}

Пожалуйста, предоставь:
1. Общую оценку рациона
2. Анализ по каждому приему пищи
3. Рекомендации по улучшению
4. Советы по балансу БЖУ`;

        const origin = request.headers.origin;
        reply.raw.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Access-Control-Allow-Origin": origin || "*",
            "Access-Control-Allow-Credentials": "true",
        });

        try {
            for await (const chunk of callOpenRouterStream(userPrompt, SYSTEM_MESSAGE)) {
                reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
            }
            reply.raw.write("data: [DONE]\n\n");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            reply.raw.write(`event: error\ndata: ${JSON.stringify(message)}\n\n`);
        }

        reply.raw.end();
    });
}
