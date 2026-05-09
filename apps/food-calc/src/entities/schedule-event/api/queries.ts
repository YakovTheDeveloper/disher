import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/shared/lib/dexie/schema';
import type { ScheduleEvent } from '../model/types';
import { mapScheduleEventRow } from './mappers';

function useAllScheduleEvents(): ScheduleEvent[] {
  const rows = useLiveQuery(() => db.schedule_events.toArray(), []);
  return useMemo(() => (rows ?? []).map(mapScheduleEventRow), [rows]);
}

export function useScheduleEvents(date: string | undefined): ScheduleEvent[] {
  const all = useAllScheduleEvents();
  return useMemo(() => {
    if (!date) return [];
    return all.filter((r) => r.date === date);
  }, [all, date]);
}
