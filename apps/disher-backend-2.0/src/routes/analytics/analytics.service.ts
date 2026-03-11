import { callOpenRouter } from "../../lib/openrouter.js";
import {
    ScheduleFoodsSnapshot,
    FoodContentProductSnapshot,
    FoodContentDishSnapshot,
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

function formatFoodItem(
    item: FoodContentProductSnapshot | FoodContentDishSnapshot | null,
    time: string
): string {
    if (!item) return "";

    if (item.variant === "product") {
        return `- ${time}: Продукт (ID: ${item.foodId}), количество: ${item.quantity}г`;
    } else {
        return `- ${time}: Блюдо (ID: ${item.dishId}), количество: ${item.quantity}г`;
    }
}

function formatScheduleForPrompt(snapshot: ScheduleFoodsSnapshot): string {
    const itemsList = snapshot.foods
        .map((item) => {
            const content = item.contentDish || item.contentProduct;
            return formatFoodItem(content, item.time);
        })
        .filter(Boolean)
        .join("\n");

    return `Рацион питания (ID расписания: ${snapshot.id}):

${itemsList || "Нет данных о продуктах"}`;
}

export async function analyzeSchedule(
    snapshot: ScheduleFoodsSnapshot
): Promise<{ success: boolean; data?: string; error?: string }> {
    const scheduleData = formatScheduleForPrompt(snapshot);

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
