import { triplit } from "@/api/triplit/client";
import { getCurrentUserId } from "@/api/triplit/session";
import { v4 as uuid } from "uuid";

export async function createDailyNorm(name: string, description: string) {
  const id = uuid();
  await triplit.insert("dailyNorms", { id, name, description, userId: getCurrentUserId() });
  return id;
}

export async function updateDailyNorm(
  normId: string,
  updates: Partial<{ name: string; description: string }>,
) {
  await triplit.update("dailyNorms", normId, (norm) => {
    if (updates.name !== undefined) norm.name = updates.name;
    if (updates.description !== undefined) norm.description = updates.description;
  });
}

export async function deleteDailyNorm(normId: string) {
  const items = await triplit.fetch(
    triplit.query("dailyNormItems").Where("normId", "=", normId),
  );
  await Promise.all(
    (Array.from(items.keys()) as unknown as string[]).map((id) => triplit.delete("dailyNormItems", id)),
  );
  await triplit.delete("dailyNorms", normId);
}

export async function setDailyNormNutrient(
  normId: string,
  nutrientId: string,
  quantity: number | null,
) {
  const existing = await triplit.fetch(
    triplit
      .query("dailyNormItems")
      .Where("normId", "=", normId)
      .Where("nutrientId", "=", nutrientId),
  );
  const existingItem = Array.from(existing.values())[0];

  if (existingItem) {
    await triplit.update("dailyNormItems", existingItem.id, (item) => {
      item.quantity = quantity;
    });
  } else {
    await triplit.insert("dailyNormItems", {
      id: uuid(),
      normId,
      nutrientId,
      quantity,
      userId: getCurrentUserId(),
    });
  }
}

export async function seedDefaultDailyNorm(defaults: Record<string, number>) {
  const normId = "DEFAULT_NORM";
  const existing = await triplit.fetchById("dailyNorms", normId);
  if (existing) return;

  await triplit.insert("dailyNorms", {
    id: normId,
    name: "Стандарт",
    description: "Стандартная норма потребления, для среднестатистического человека",
    userId: getCurrentUserId(),
  });

  await Promise.all(
    Object.entries(defaults).map(([nutrientId, quantity], index) =>
      triplit.insert("dailyNormItems", {
        id: (index + 1).toString(),
        normId,
        nutrientId,
        quantity,
        userId: getCurrentUserId(),
      }),
    ),
  );
}
