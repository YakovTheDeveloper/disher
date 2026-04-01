import { getCurrentUserId } from "@/shared/lib/user";
import { events } from "@/livestore/schema";
import type { Store } from "@livestore/livestore";
import type { DailyNormItems } from "../model/types";

type DailyNormUpdatedPayload = Parameters<typeof events.dailyNormUpdated>[0];
type DailyNormUpdates = Omit<DailyNormUpdatedPayload, 'id'>;

export function createDailyNorm(store: Store, name: string, description: string) {
  const id = crypto.randomUUID();
  store.commit(
    events.dailyNormCreated({
      id,
      name,
      description,
      userId: getCurrentUserId(),
      items: "{}",
    }),
  );
  return id;
}

export function updateDailyNorm(
  store: Store,
  normId: string,
  updates: DailyNormUpdates,
) {
  store.commit(events.dailyNormUpdated({ id: normId, ...updates }));
}

export function deleteDailyNorm(store: Store, normId: string) {
  store.commit(events.dailyNormDeleted({ id: normId, deletedAt: Date.now() }));
}

export function setDailyNormNutrient(
  store: Store,
  normId: string,
  nutrientId: string,
  quantity: number | null,
  currentItems: DailyNormItems,
) {
  const next = { ...currentItems };

  if (quantity === null || quantity === 0) {
    delete next[nutrientId];
  } else {
    next[nutrientId] = quantity;
  }

  store.commit(events.dailyNormUpdated({ id: normId, items: JSON.stringify(next) }));
}

export function seedDefaultDailyNorm(store: Store, defaults: Record<string, number>) {
  const normId = "DEFAULT_NORM";
  store.commit(
    events.dailyNormCreated({
      id: normId,
      name: "Стандарт",
      description: "Стандартная норма потребления, для среднестатистического человека",
      userId: getCurrentUserId(),
      items: JSON.stringify(defaults),
    }),
  );
}
