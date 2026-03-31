import { getCurrentUserId } from "@/shared/lib/user";
import { events } from "@/livestore/schema";
import type { Store } from "@livestore/livestore";

export function createDish(store: Store, name: string) {
  const id = crypto.randomUUID();
  store.commit(events.dishCreated({ id, name, userId: getCurrentUserId(), createdAt: Date.now() }));
  return id;
}

export function updateDishName(store: Store, dishId: string, name: string) {
  store.commit(events.dishUpdated({ id: dishId, name, updatedAt: Date.now() }));
}

export function deleteDish(
  store: Store,
  dishId: string,
  itemIds: string[],
  portionIds: string[],
) {
  const deletedAt = Date.now();
  store.commit(
    ...itemIds.map((id) => events.dishItemDeleted({ id, deletedAt })),
    ...portionIds.map((id) => events.dishPortionDeleted({ id, deletedAt })),
    events.dishDeleted({ id: dishId, deletedAt }),
  );
}

export function deleteDishes(
  store: Store,
  dishes: Array<{ id: string; itemIds: string[]; portionIds: string[] }>,
) {
  const deletedAt = Date.now();
  const allEvents = dishes.flatMap((d) => [
    ...d.itemIds.map((id) => events.dishItemDeleted({ id, deletedAt })),
    ...d.portionIds.map((id) => events.dishPortionDeleted({ id, deletedAt })),
    events.dishDeleted({ id: d.id, deletedAt }),
  ]);
  store.commit(...allEvents);
}

export function addDishItem(
  store: Store,
  params: { dishId: string; foodId: string; quantity: number },
) {
  const id = crypto.randomUUID();
  store.commit(
    events.dishItemCreated({
      id,
      dishId: params.dishId,
      foodId: params.foodId,
      quantity: params.quantity,
      userId: getCurrentUserId(),
    }),
  );
  return id;
}

export function updateDishItem(
  store: Store,
  itemId: string,
  updates: Partial<{ foodId: string; quantity: number }>,
) {
  store.commit(events.dishItemUpdated({ id: itemId, ...updates }));
}

export function removeDishItem(store: Store, itemId: string) {
  store.commit(events.dishItemDeleted({ id: itemId, deletedAt: Date.now() }));
}

export function copyDishItems(
  store: Store,
  items: Array<{ foodId: string; quantity: number }>,
  toDishId: string,
) {
  store.commit(
    ...items.map((item) =>
      events.dishItemCreated({
        id: crypto.randomUUID(),
        dishId: toDishId,
        foodId: item.foodId,
        quantity: item.quantity,
        userId: getCurrentUserId(),
      }),
    ),
  );
}

export function addDishPortion(
  store: Store,
  dishId: string,
  portion: { label: string; amount: number; unit: string; grams: number },
) {
  store.commit(
    events.dishPortionCreated({
      id: crypto.randomUUID(),
      dishId,
      userId: getCurrentUserId(),
      label: portion.label,
      amount: portion.amount,
      unit: portion.unit,
      grams: portion.grams,
    }),
  );
}

export function updateDishPortion(
  store: Store,
  portionId: string,
  updates: Partial<{ label: string; amount: number; unit: string; grams: number }>,
) {
  store.commit(events.dishPortionUpdated({ id: portionId, ...updates }));
}

export function removeDishPortion(store: Store, portionId: string) {
  store.commit(events.dishPortionDeleted({ id: portionId, deletedAt: Date.now() }));
}

export function dishItemsToScheduleFoods(
  store: Store,
  items: Array<{ foodId: string; quantity: number }>,
  date: string,
  time: string,
) {
  store.commit(
    ...items.map((item) =>
      events.scheduleFoodCreated({
        id: crypto.randomUUID(),
        date,
        time,
        type: "food",
        quantity: item.quantity,
        foodId: item.foodId,
        dishId: "",
        details: "",
        userId: getCurrentUserId(),
      }),
    ),
  );
}
