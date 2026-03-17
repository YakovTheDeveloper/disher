import { callOpenRouter } from "../../lib/openrouter.js";
import { prisma } from "../../client.js";
import {
    ScheduleFoodsSnapshot,
} from "./validation.js";

const SYSTEM_MESSAGE = `Ты - профессиональный диетолог-нутрициолог. Твоя задача - анализировать дневной рацион питания и давать рекомендации по его улучшению.

Правила:
1. Анализируй пищевую ценность каждого приема пищи
2. Обращай внимание на баланс белков, жиров и углеводов
3. Учитывай калорийность и распределение нутриентов в течение дня
4. Давай практические рекомендации по улучшению рациона
5. Отвечай на русском языке
6. Используй структурированный формат ответа с заголовками
7. Если данных недостаточно для полного анализа, укажи это`;

async function resolveNames(snapshot: ScheduleFoodsSnapshot): Promise<{
    foodNames: Map<string, string>;
    dishNames: Map<string, string>;
}> {
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

    const foodNames = new Map(foods.map((f) => [String(f.id), f.name]));
    const dishNames = new Map(dishes.map((d) => [String(d.id), d.name]));

    return { foodNames, dishNames };
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

    return `Рацион питания (ID расписания: ${snapshot.id}):

${itemsList || "Нет данных о продуктах"}`;
}

export async function analyzeSchedule(
    snapshot: ScheduleFoodsSnapshot
): Promise<{ success: boolean; data?: string; error?: string }> {
    const { foodNames, dishNames } = await resolveNames(snapshot);
    const scheduleData = formatScheduleForPrompt(snapshot, foodNames, dishNames);

    const userPrompt = `Проанализируй следующий дневной рацион питания и дай рекомендации:

${scheduleData}

Пожалуйста, предоставь:
1. Общую оценку рациона
2. Анализ по каждому приему пищи
3. Рекомендации по улучшению
4. Советы по балансу БЖУ`;

    const result = await callOpenRouter(userPrompt, SYSTEM_MESSAGE);

    if (result.code === 200 && result.data) {
        return { success: true, data: result.data };
    }

    return {
        success: false,
        error: result.message || "Unknown error occurred",
    };
}
