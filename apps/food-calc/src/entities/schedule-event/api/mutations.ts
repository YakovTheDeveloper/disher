import { db, type ScheduleEventRow } from '@/shared/lib/dexie/schema';
import { getUserIdSync } from '@/shared/lib/auth/useUserId';
import { scheduleHot } from '@/shared/lib/sync/scheduler';
import type { Atom } from '@/entities/schedule-event/model/atoms';

function requireUserId(): string {
  const userId = getUserIdSync();
  if (!userId) throw new Error('Not authenticated');
  return userId;
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
  await db.schedule_events.add({
    id,
    user_id: userId,
    date: params.date,
    time: params.time,
    end_time: params.endTime ?? '',
    text: params.text ?? '',
    atoms: params.atoms ?? [],
  } as unknown as ScheduleEventRow);
  scheduleHot();
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
  scheduleHot();
}

export async function removeScheduleEvent(eventId: string): Promise<void> {
  await db.schedule_events.update(eventId, {
    deleted_at: new Date().toISOString(),
  });
  scheduleHot();
}

export async function removeScheduleEvents(eventIds: string[]): Promise<void> {
  if (eventIds.length === 0) return;
  const now = new Date().toISOString();
  await db.transaction('rw', db.schedule_events, async () => {
    for (const id of eventIds) {
      await db.schedule_events.update(id, { deleted_at: now });
    }
  });
  scheduleHot();
}
