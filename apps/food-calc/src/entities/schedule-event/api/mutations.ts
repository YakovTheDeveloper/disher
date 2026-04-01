import { getCurrentUserId } from "@/shared/lib/user";
import { events } from "@/livestore/schema";
import type { Store } from "@livestore/livestore";
import type { Atom } from "@/entities/schedule-event/model/atoms";

type ScheduleEventUpdatedPayload = Parameters<typeof events.scheduleEventUpdated>[0];
type ScheduleEventUpdates = Omit<ScheduleEventUpdatedPayload, 'id'>;

export function addScheduleEvent(
  store: Store,
  params: {
    date: string;
    time: string;
    endTime?: string;
    text?: string;
    atoms?: Atom[];
  },
) {
  const id = crypto.randomUUID();
  store.commit(
    events.scheduleEventCreated({
      id,
      date: params.date,
      time: params.time,
      endTime: params.endTime ?? "",
      text: params.text ?? "",
      atoms: JSON.stringify(params.atoms ?? []),
      userId: getCurrentUserId(),
    }),
  );
  return id;
}

export function updateScheduleEvent(
  store: Store,
  eventId: string,
  updates: Omit<ScheduleEventUpdates, 'atoms'> & { atoms?: Atom[] },
) {
  const { atoms, ...rest } = updates;
  store.commit(events.scheduleEventUpdated({
    id: eventId,
    ...rest,
    ...(atoms !== undefined && { atoms: JSON.stringify(atoms) }),
  }));
}

export function removeScheduleEvent(store: Store, eventId: string) {
  store.commit(events.scheduleEventDeleted({ id: eventId, deletedAt: Date.now() }));
}

export function removeScheduleEvents(store: Store, eventIds: string[]) {
  const deletedAt = Date.now();
  store.commit(...eventIds.map((id) => events.scheduleEventDeleted({ id, deletedAt })));
}
