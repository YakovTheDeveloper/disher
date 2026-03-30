import { getCurrentUserId } from "@/api/triplit/session";
import { events } from "@/livestore/schema";
import type { Store } from "@livestore/livestore";

export function addPeriod(
  store: Store,
  params: {
    name: string;
    description?: string | null;
    startDate: string;
    endDate: string;
    colorIndex: number;
  },
) {
  const id = crypto.randomUUID();
  store.commit(
    events.periodCreated({
      id,
      userId: getCurrentUserId(),
      name: params.name,
      description: params.description ?? "",
      startDate: params.startDate,
      endDate: params.endDate,
      colorIndex: params.colorIndex,
    }),
  );
  return id;
}

export function removePeriod(store: Store, id: string) {
  store.commit(events.periodDeleted({ id }));
}

export function updatePeriod(
  store: Store,
  id: string,
  updates: Partial<{
    name: string;
    description: string | null;
    startDate: string;
    endDate: string;
    colorIndex: number;
  }>,
) {
  const mapped: Record<string, string | number> = { id };
  if (updates.name !== undefined) mapped.name = updates.name;
  if (updates.description !== undefined) mapped.description = updates.description ?? "";
  if (updates.startDate !== undefined) mapped.startDate = updates.startDate;
  if (updates.endDate !== undefined) mapped.endDate = updates.endDate;
  if (updates.colorIndex !== undefined) mapped.colorIndex = updates.colorIndex;

  store.commit(events.periodUpdated(mapped as Parameters<typeof events.periodUpdated>[0]));
}
