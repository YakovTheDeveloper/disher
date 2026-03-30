import { getCurrentUserId } from "@/api/triplit/session";
import { events } from "@/livestore/schema";
import type { Store } from "@livestore/livestore";
import type { ClipboardItem } from "@/shared/model/clipboardStore";

export function addScheduleFood(
  store: Store,
  params: {
    date: string;
    time: string;
    type: "food" | "dish";
    quantity: number;
    foodId?: string | null;
    dishId?: string | null;
    details?: string | null;
  },
) {
  const hasFoodId = params.foodId != null;
  const hasDishId = params.dishId != null;

  if (hasFoodId && hasDishId) {
    throw new Error("addScheduleFood: cannot set both foodId and dishId");
  }
  if (!hasFoodId && !hasDishId) {
    throw new Error("addScheduleFood: must set either foodId or dishId");
  }

  const id = crypto.randomUUID();
  store.commit(
    events.scheduleFoodCreated({
      id,
      date: params.date,
      time: params.time,
      type: params.type,
      quantity: params.quantity,
      details: params.details ?? "",
      foodId: params.foodId ?? "",
      dishId: params.dishId ?? "",
      userId: getCurrentUserId(),
    }),
  );
  return id;
}

export function updateScheduleFood(
  store: Store,
  itemId: string,
  updates: Partial<{
    time: string;
    quantity: number;
    details: string | null;
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

  const mapped: Record<string, string | number | undefined> = { id: itemId };
  if (updates.time !== undefined) mapped.time = updates.time;
  if (updates.quantity !== undefined) mapped.quantity = updates.quantity;
  if (updates.details !== undefined) mapped.details = updates.details ?? "";
  if (updates.foodId !== undefined) mapped.foodId = updates.foodId ?? "";
  if (updates.dishId !== undefined) mapped.dishId = updates.dishId ?? "";
  if (updates.type !== undefined) mapped.type = updates.type;

  store.commit(events.scheduleFoodUpdated(mapped as Parameters<typeof events.scheduleFoodUpdated>[0]));
}

export function removeScheduleFood(store: Store, itemId: string) {
  store.commit(events.scheduleFoodDeleted({ id: itemId }));
}

export function removeScheduleFoods(store: Store, itemIds: string[]) {
  store.commit(...itemIds.map((id) => events.scheduleFoodDeleted({ id })));
}

export function pasteClipboardItems(
  store: Store,
  items: ClipboardItem[],
  targetDate: string,
) {
  store.commit(
    ...items.map((item) =>
      events.scheduleFoodCreated({
        id: crypto.randomUUID(),
        date: targetDate,
        time: item.time,
        type: item.type,
        quantity: item.quantity,
        details: item.details ?? "",
        foodId: item.foodId ?? "",
        dishId: item.dishId ?? "",
        userId: getCurrentUserId(),
      }),
    ),
  );
}
