import { triplit } from "@/api/triplit/client";
import { getCurrentUserId } from "@/api/triplit/session";
import { v4 as uuid } from "uuid";

export async function addScheduleFood(params: {
  date: string;
  time: string;
  type: "food" | "dish";
  quantity: number;
  foodId?: string | null;
  dishId?: string | null;
}) {
  const hasFoodId = params.foodId != null;
  const hasDishId = params.dishId != null;

  if (hasFoodId && hasDishId) {
    throw new Error("addScheduleFood: cannot set both foodId and dishId");
  }
  if (!hasFoodId && !hasDishId) {
    throw new Error("addScheduleFood: must set either foodId or dishId");
  }

  const id = uuid();
  await triplit.insert("scheduleFoods", {
    id,
    date: params.date,
    time: params.time,
    type: params.type,
    quantity: params.quantity,
    foodId: params.foodId ?? null,
    dishId: params.dishId ?? null,
    userId: getCurrentUserId(),
  });
  return id;
}

export async function updateScheduleFood(
  itemId: string,
  updates: Partial<{
    time: string;
    quantity: number;
    foodId: string | null;
    dishId: string | null;
    type: "food" | "dish";
  }>,
) {
  if (updates.foodId !== undefined && updates.dishId !== undefined) {
    const hasFoodId = updates.foodId != null;
    const hasDishId = updates.dishId != null;
    if (hasFoodId && hasDishId) {
      throw new Error("updateScheduleFood: cannot set both foodId and dishId");
    }
    if (!hasFoodId && !hasDishId) {
      throw new Error("updateScheduleFood: must set either foodId or dishId");
    }
  }

  await triplit.update("scheduleFoods", itemId, (item) => {
    if (updates.time !== undefined) item.time = updates.time;
    if (updates.quantity !== undefined) item.quantity = updates.quantity;
    if (updates.foodId !== undefined) item.foodId = updates.foodId;
    if (updates.dishId !== undefined) item.dishId = updates.dishId;
    if (updates.type !== undefined) item.type = updates.type;
  });
}

export async function removeScheduleFood(itemId: string) {
  await triplit.delete("scheduleFoods", itemId);
}

export async function removeScheduleFoods(itemIds: string[]) {
  await Promise.all(itemIds.map((id) => triplit.delete("scheduleFoods", id)));
}

export async function copyScheduleFoods(
  fromDate: string,
  toDate: string,
  itemIds: string[],
) {
  const items = await triplit.fetch(
    triplit.query("scheduleFoods").Where("date", "=", fromDate),
  );
  const toCopy = Array.from(items.values()).filter((item) => itemIds.includes(item.id));
  await Promise.all(
    toCopy.map((item) =>
      addScheduleFood({
        date: toDate,
        time: item.time,
        type: item.type as "food" | "dish",
        quantity: item.quantity,
        foodId: item.foodId,
        dishId: item.dishId,
      }),
    ),
  );
}

/**
 * Copy schedule foods into a dish as DishItems.
 */
export async function scheduleFoodsToDishItems(
  scheduleFoodIds: string[],
  dishId: string,
) {
  const allItems = await triplit.fetch(triplit.query("scheduleFoods"));
  const items = Array.from(allItems.values()).filter(
    (item) => scheduleFoodIds.includes(item.id) && item.type === "food" && item.foodId,
  );

  await Promise.all(
    items.map((item) =>
      triplit.insert("dishItems", {
        id: uuid(),
        dishId,
        foodId: item.foodId!,
        quantity: item.quantity,
        userId: getCurrentUserId(),
      }),
    ),
  );
}
