import { triplit } from "@/api/triplit/client";
import { v4 as uuid } from "uuid";

const getUserId = () => "1"; // TODO: replace with actual auth

export async function addScheduleEvent(params: {
  date: string;
  time: string;
  text?: string;
  atoms?: unknown[];
}) {
  const id = uuid();
  await triplit.insert("scheduleEvents", {
    id,
    date: params.date,
    time: params.time,
    text: params.text ?? "",
    atoms: params.atoms ?? [],
    userId: getUserId(),
  });
  return id;
}

export async function updateScheduleEvent(
  eventId: string,
  updates: Partial<{ time: string; text: string; atoms: unknown[] }>,
) {
  await triplit.update("scheduleEvents", eventId, (event) => {
    if (updates.time !== undefined) event.time = updates.time;
    if (updates.text !== undefined) event.text = updates.text;
    if (updates.atoms !== undefined) event.atoms = updates.atoms;
  });
}

export async function removeScheduleEvent(eventId: string) {
  await triplit.delete("scheduleEvents", eventId);
}
