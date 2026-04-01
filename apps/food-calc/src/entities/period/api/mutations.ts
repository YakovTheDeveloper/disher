import { getCurrentUserId } from "@/shared/lib/user";
import { events } from "@/livestore/schema";
import type { Store } from "@livestore/livestore";

type PeriodUpdatedPayload = Parameters<typeof events.periodUpdated>[0];
type PeriodUpdates = Omit<PeriodUpdatedPayload, 'id'>;

export function addPeriod(
  store: Store,
  params: {
    name: string;
    colorIndex: number;
    fontFamily?: string;
    fontSize?: number;
  },
) {
  const id = crypto.randomUUID();
  store.commit(
    events.periodCreated({
      id,
      userId: getCurrentUserId(),
      name: params.name.trim(),
      colorIndex: params.colorIndex,
      fontFamily: params.fontFamily ?? 'sans',
      fontSize: params.fontSize ?? 16,
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
