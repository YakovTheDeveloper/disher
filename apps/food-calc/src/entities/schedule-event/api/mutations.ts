import { getCurrentUserId } from "@/shared/lib/user";
import { events } from "@/livestore/schema";
import type { Store } from "@livestore/livestore";
import type { Atom } from "@/entities/schedule-event/model/atoms";

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
  updates: Partial<{ time: string; endTime: string; text: string; atoms: Atom[] }>,
) {
  const mapped: Record<string, string> = { id: eventId };
  if (updates.time !== undefined) mapped.time = updates.time;
  if (updates.endTime !== undefined) mapped.endTime = updates.endTime;
  if (updates.text !== undefined) mapped.text = updates.text;
  if (updates.atoms !== undefined) mapped.atoms = JSON.stringify(updates.atoms);

  store.commit(events.scheduleEventUpdated(mapped as Parameters<typeof events.scheduleEventUpdated>[0]));
}

export function removeScheduleEvent(store: Store, eventId: string) {
  store.commit(events.scheduleEventDeleted({ id: eventId, deletedAt: Date.now() }));
}
