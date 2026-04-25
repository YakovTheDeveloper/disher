import { db } from "@/powersync/database";
import { supabase } from "@/powersync/supabase-client";
import type { Atom } from "@/entities/schedule-event/model/atoms";

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export async function addScheduleEvent(params: {
  date: string;
  time: string;
  endTime?: string;
  text?: string;
  atoms?: Atom[];
}): Promise<string> {
  const id = crypto.randomUUID();
  const userId = await currentUserId();
  const now = new Date().toISOString();
  await db.execute(
    `insert into schedule_events (id, user_id, date, time, end_time, text, atoms, created_at)
     values (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      params.date,
      params.time,
      params.endTime ?? "",
      params.text ?? "",
      JSON.stringify(params.atoms ?? []),
      now,
    ],
  );
  return id;
}

export async function updateScheduleEvent(
  eventId: string,
  updates: Partial<{
    date: string;
    time: string;
    endTime: string;
    text: string;
    atoms: Atom[];
  }>,
): Promise<void> {
  const COLUMN_MAP: Record<string, string> = {
    date: "date",
    time: "time",
    endTime: "end_time",
    text: "text",
    atoms: "atoms",
  };
  const keys = Object.keys(updates) as (keyof typeof updates)[];
  if (keys.length === 0) return;
  const setClauses = keys.map((k) => `${COLUMN_MAP[k]} = ?`).join(", ");
  const values = keys.map((k) => {
    if (k === "atoms") return JSON.stringify(updates.atoms ?? []);
    return updates[k];
  });
  await db.execute(
    `update schedule_events set ${setClauses}, updated_at = ? where id = ?`,
    [...values, new Date().toISOString(), eventId],
  );
}

export async function removeScheduleEvent(eventId: string): Promise<void> {
  await db.execute(
    `update schedule_events set deleted_at = ? where id = ?`,
    [new Date().toISOString(), eventId],
  );
}

export async function removeScheduleEvents(eventIds: string[]): Promise<void> {
  const deletedAt = new Date().toISOString();
  await db.writeTransaction(async (tx) => {
    for (const id of eventIds) {
      await tx.execute(
        `update schedule_events set deleted_at = ? where id = ?`,
        [deletedAt, id],
      );
    }
  });
}
