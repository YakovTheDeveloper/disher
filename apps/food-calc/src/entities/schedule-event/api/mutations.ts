import { db, type ScheduleEventRow } from '@/shared/lib/dexie/schema';
import type { Atom } from '@/entities/schedule-event/model/atoms';

const now = () => new Date().toISOString();

export async function addScheduleEvent(params: {
  date: string;
  time: string;
  endTime?: string;
  text?: string;
  atoms?: Atom[];
}): Promise<string> {
  const id = crypto.randomUUID();
  const row: ScheduleEventRow = {
    id,
    date: params.date,
    time: params.time,
    end_time: params.endTime ?? '',
    text: params.text ?? '',
    atoms: params.atoms ?? [],
    created_at: now(),
  };
  await db.schedule_events.add(row);
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
  date: 'date',
  time: 'time',
  endTime: 'end_time',
  text: 'text',
  atoms: 'atoms',
};

export async function updateScheduleEvent(
  eventId: string,
  updates: ScheduleEventUpdates,
): Promise<void> {
  const keys = Object.keys(updates) as (keyof ScheduleEventUpdates)[];
  if (keys.length === 0) return;
  const patch: Record<string, unknown> = {};
  for (const k of keys) {
    const col = COLUMN_MAP[k];
    if (k === 'atoms') patch[col] = updates.atoms ?? [];
    else patch[col] = updates[k];
  }
  await db.schedule_events.update(eventId, patch);
}

export async function removeScheduleEvent(eventId: string): Promise<void> {
  await db.schedule_events.delete(eventId);
}

export async function removeScheduleEvents(eventIds: string[]): Promise<void> {
  if (eventIds.length === 0) return;
  await db.schedule_events.bulkDelete(eventIds);
}
