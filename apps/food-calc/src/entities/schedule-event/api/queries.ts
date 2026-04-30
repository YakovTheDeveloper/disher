import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/shared/lib/dexie/schema';
import { useUserId } from '@/shared/lib/auth/useUserId';
import type { ScheduleEvent } from '../model/types';
import { mapScheduleEventRow } from './mappers';

function useAllScheduleEvents(): ScheduleEvent[] {
  const userId = useUserId();
  const rows = useLiveQuery(async () => {
    if (!userId) return [];
    return db.schedule_events
      .where('user_id')
      .equals(userId)
      .filter((r) => !r.deleted_at)
      .toArray();
  }, [userId]);
  return useMemo(() => (rows ?? []).map(mapScheduleEventRow), [rows]);
}

export function useScheduleEvents(date: string | undefined): ScheduleEvent[] {
  const all = useAllScheduleEvents();
  return useMemo(() => {
    if (!date) return [];
    return all.filter((r) => r.date === date);
  }, [all, date]);
}
