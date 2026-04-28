import { enqueue, enqueueMany, drain } from "@/shared/lib/storage/pendingWrites";
import { queryClient } from "@/shared/lib/storage/queryClient";
import { getUserIdSync } from "@/shared/lib/auth/useUserId";
import type { Atom } from "@/entities/schedule-event/model/atoms";
import type { ScheduleEvent } from "../model/types";

const TABLE = "schedule_events";

function requireUserId(): string {
  const userId = getUserIdSync();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

function patchScheduleEventsCache(updater: (rows: ScheduleEvent[]) => ScheduleEvent[]) {
  queryClient.setQueriesData<ScheduleEvent[]>(
    { queryKey: ["schedule_events", "all"] },
    (old) => (old ? updater(old) : old),
  );
}

export async function addScheduleEvent(params: {
  date: string;
  time: string;
  endTime?: string;
  text?: string;
  atoms?: Atom[];
}): Promise<string> {
  const id = crypto.randomUUID();
  const userId = requireUserId();
  const now = new Date().toISOString();
  const atoms = params.atoms ?? [];

  const row = {
    id,
    user_id: userId,
    date: params.date,
    time: params.time,
    end_time: params.endTime ?? "",
    text: params.text ?? "",
    atoms,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  const optimistic: ScheduleEvent = {
    id,
    userId,
    date: params.date,
    time: params.time,
    endTime: params.endTime ?? "",
    text: params.text ?? "",
    atoms,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  patchScheduleEventsCache((rows) => [...rows, optimistic]);

  await enqueue({ table: TABLE, op: "insert", payload: row });
  void drain();
  return id;
}

type ScheduleEventUpdates = Partial<{
  date: string;
  time: string;
  endTime: string;
  text: string;
  atoms: Atom[];
}>;

const COLUMN_MAP: Record<keyof ScheduleEventUpdates, string> = {
  date: "date",
  time: "time",
  endTime: "end_time",
  text: "text",
  atoms: "atoms",
};

export async function updateScheduleEvent(
  eventId: string,
  updates: ScheduleEventUpdates,
): Promise<void> {
  const keys = Object.keys(updates) as (keyof ScheduleEventUpdates)[];
  if (keys.length === 0) return;

  const now = new Date().toISOString();
  patchScheduleEventsCache((rows) =>
    rows.map((r) => {
      if (r.id !== eventId) return r;
      const next: ScheduleEvent = { ...r };
      for (const k of keys) {
        if (k === "date") next.date = updates.date as string;
        else if (k === "time") next.time = updates.time as string;
        else if (k === "endTime") next.endTime = updates.endTime as string;
        else if (k === "text") next.text = updates.text as string;
        else if (k === "atoms") next.atoms = (updates.atoms ?? []) as Atom[];
      }
      next.updatedAt = now;
      return next;
    }),
  );

  const payload: Record<string, unknown> = { id: eventId, updated_at: now };
  for (const k of keys) {
    const col = COLUMN_MAP[k];
    if (k === "atoms") payload[col] = updates.atoms ?? [];
    else payload[col] = updates[k];
  }

  await enqueue({ table: TABLE, op: "upsert", payload });
  void drain();
}

export async function removeScheduleEvent(eventId: string): Promise<void> {
  // No invalidate after enqueue — see deleteProduct comment (delete-flicker race).
  patchScheduleEventsCache((rows) => rows.filter((r) => r.id !== eventId));
  await enqueue({ table: TABLE, op: "delete", payload: { id: eventId } });
  void drain();
}

export async function removeScheduleEvents(eventIds: string[]): Promise<void> {
  if (eventIds.length === 0) return;
  const idSet = new Set(eventIds);
  patchScheduleEventsCache((rows) => rows.filter((r) => !idSet.has(r.id)));
  await enqueueMany(
    eventIds.map((id) => ({ table: TABLE, op: "delete" as const, payload: { id } })),
  );
  void drain();
}
