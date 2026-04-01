import { getCurrentUserId } from "@/shared/lib/user";
import { events } from "@/livestore/schema";
import type { Store } from "@livestore/livestore";
import type { ClipboardItem } from "@/shared/model/clipboardStore";

type ScheduleFoodUpdatedPayload = Parameters<typeof events.scheduleFoodUpdated>[0];
type ScheduleFoodUpdates = Omit<ScheduleFoodUpdatedPayload, 'id'>;

/** Accepts null for nullable-feeling fields, coerces to "" before committing */
type ScheduleFoodUpdateInput = {
  [K in keyof ScheduleFoodUpdates]: K extends 'productId' | 'dishId' | 'details'
    ? ScheduleFoodUpdates[K] | null
    : ScheduleFoodUpdates[K];
};

export function addScheduleFood(
  store: Store,
  params: {
    date: string;
    time: string;
    type: "food" | "dish";
    quantity: number;
    productId?: string | null;
    dishId?: string | null;
    details?: string | null;
  },
) {
  const hasProductId = params.productId != null;
  const hasDishId = params.dishId != null;

  if (hasProductId && hasDishId) {
    throw new Error("addScheduleFood: cannot set both productId and dishId");
  }
  if (!hasProductId && !hasDishId) {
    throw new Error("addScheduleFood: must set either productId or dishId");
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
      productId: params.productId ?? "",
      dishId: params.dishId ?? "",
      userId: getCurrentUserId(),
    }),
  );
  return id;
}

export function updateScheduleFood(
  store: Store,
  itemId: string,
  updates: ScheduleFoodUpdateInput,
) {
  if (updates.productId !== undefined && updates.dishId !== undefined) {
    const hasProductId = updates.productId != null;
    const hasDishId = updates.dishId != null;
    if (hasProductId && hasDishId) {
      throw new Error("updateScheduleFood: cannot set both productId and dishId");
    }
    if (!hasProductId && !hasDishId) {
      throw new Error("updateScheduleFood: must set either productId or dishId");
    }
  }

  const { productId, dishId, details, ...rest } = updates;

  store.commit(events.scheduleFoodUpdated({
    id: itemId,
    ...rest,
    ...(details !== undefined && { details: details ?? "" }),
    ...(productId !== undefined && { productId: productId ?? "" }),
    ...(dishId !== undefined && { dishId: dishId ?? "" }),
  }));
}

export function removeScheduleFood(store: Store, itemId: string) {
  store.commit(events.scheduleFoodDeleted({ id: itemId, deletedAt: Date.now() }));
}

export function removeScheduleFoods(store: Store, itemIds: string[]) {
  const deletedAt = Date.now();
  store.commit(...itemIds.map((id) => events.scheduleFoodDeleted({ id, deletedAt })));
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
        productId: item.productId ?? "",
        dishId: item.dishId ?? "",
        userId: getCurrentUserId(),
      }),
    ),
  );
}
