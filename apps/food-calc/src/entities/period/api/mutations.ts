import { getCurrentUserId } from "@/shared/lib/user";
import { events } from "@/livestore/schema";
import type { Store } from "@livestore/livestore";

type PeriodUpdatedPayload = Parameters<typeof events.periodUpdated>[0];
type PeriodUpdates = Omit<PeriodUpdatedPayload, 'id'>;

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
      createdAt: Date.now(),
    }),
  );
  return id;
}

export function removePeriod(store: Store, id: string) {
  store.commit(events.periodDeleted({ id, deletedAt: Date.now() }));
}

export function updatePeriod(
  store: Store,
  id: string,
  updates: PeriodUpdates,
) {
  store.commit(events.periodUpdated({ id, ...updates }));
}
