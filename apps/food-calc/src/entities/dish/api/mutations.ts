import { triplit } from "@/api/triplit/client";
import { getCurrentUserId } from "@/api/triplit/session";
import { v4 as uuid } from "uuid";

export async function createDish(name: string) {
  const id = uuid();
  await triplit.insert("dishes", { id, name, userId: getCurrentUserId() });
  return id;
}

export async function updateDishName(dishId: string, name: string) {
  await triplit.update("dishes", dishId, (dish) => {
    dish.name = name;
    dish.updatedAt = new Date();
  });
}

export async function deleteDish(dishId: string) {
  const items = await triplit.fetch(
    triplit.query("dishItems").Where("dishId", "=", dishId),
  );
  const portions = await triplit.fetch(
    triplit.query("dishPortions").Where("dishId", "=", dishId),
  );
  await Promise.all([
    ...(Array.from(items.keys()) as unknown as string[]).map((id) => triplit.delete("dishItems", id)),
    ...(Array.from(portions.keys()) as unknown as string[]).map((id) => triplit.delete("dishPortions", id)),
  ]);
  await triplit.delete("dishes", dishId);
}

export async function deleteDishes(dishIds: string[]) {
  await Promise.all(dishIds.map(deleteDish));
}

export async function addDishItem(params: {
  dishId: string;
  foodId: string;
  quantity: number;
}) {
  const id = uuid();
  await triplit.insert("dishItems", {
    id,
    dishId: params.dishId,
    foodId: params.foodId,
    quantity: params.quantity,
    userId: getCurrentUserId(),
  });
  return id;
}

export async function updateDishItem(
  itemId: string,
  updates: Partial<{ foodId: string; quantity: number }>,
) {
  await triplit.update("dishItems", itemId, (item) => {
    if (updates.foodId !== undefined) item.foodId = updates.foodId;
    if (updates.quantity !== undefined) item.quantity = updates.quantity;
  });
}

export async function removeDishItem(itemId: string) {
  await triplit.delete("dishItems", itemId);
}

export async function createDishWithItems(
  name: string,
  items: Array<{ foodId: string; quantity: number }>,
) {
  const dishId = await createDish(name);
  await Promise.all(
    items.map((item) => addDishItem({ dishId, foodId: item.foodId, quantity: item.quantity })),
  );
  return dishId;
}

/**
 * Copy DishItems from one dish to another.
 */
export async function copyDishItems(
  fromDishId: string,
  toDishId: string,
  itemIds?: string[],
) {
  const allItems = await triplit.fetch(
    triplit.query("dishItems").Where("dishId", "=", fromDishId),
  );
  const items = Array.from(allItems.values()).filter(
    (item) => !itemIds || itemIds.includes(item.id),
  );
  await Promise.all(
    items.map((item) =>
      addDishItem({ dishId: toDishId, foodId: item.foodId, quantity: item.quantity }),
    ),
  );
}

/**
 * Copy DishItems into a schedule as ScheduleFoods.
 * Used when user wants to "copy dish items to a day".
 */
// ─── Dish Portions ───

export async function addDishPortion(
  dishId: string,
  portion: { label: string; amount: number; unit: string; grams: number },
) {
  await triplit.insert("dishPortions", {
    id: uuid(),
    dishId,
    userId: getCurrentUserId(),
    label: portion.label,
    amount: portion.amount,
    unit: portion.unit,
    grams: portion.grams,
  });
}

export async function updateDishPortion(
  portionId: string,
  updates: Partial<{ label: string; amount: number; unit: string; grams: number }>,
) {
  await triplit.update("dishPortions", portionId, (p) => {
    if (updates.label !== undefined) p.label = updates.label;
    if (updates.amount !== undefined) p.amount = updates.amount;
    if (updates.unit !== undefined) p.unit = updates.unit;
    if (updates.grams !== undefined) p.grams = updates.grams;
  });
}

export async function removeDishPortion(portionId: string) {
  await triplit.delete("dishPortions", portionId);
}

export async function dishItemsToScheduleFoods(
  dishId: string,
  scheduleId: string,
  time: string,
  itemIds?: string[],
) {
  const allItems = await triplit.fetch(
    triplit.query("dishItems").Where("dishId", "=", dishId),
  );
  const items = Array.from(allItems.values()).filter(
    (item) => !itemIds || itemIds.includes(item.id),
  );
  await Promise.all(
    items.map((item) =>
      triplit.insert("scheduleFoods", {
        id: uuid(),
        date: scheduleId,
        time,
        type: "food" as const,
        quantity: item.quantity,
        foodId: item.foodId,
        dishId: null,
        userId: getCurrentUserId(),
      }),
    ),
  );
}
