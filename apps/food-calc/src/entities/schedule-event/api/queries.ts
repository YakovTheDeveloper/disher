import { useQuery } from "@powersync/react";
import { snakeToCamel } from "@/shared/lib/rowMapper";
import type { ScheduleEvent } from "../model/types";

function mapRow(row: Record<string, unknown>): ScheduleEvent {
  return snakeToCamel(row) as unknown as ScheduleEvent;
}

export function useScheduleEvents(date: string | undefined): ScheduleEvent[] {
  const { data } = useQuery<Record<string, unknown>>(
    `select id, user_id, date, time, end_time, text, atoms,
            created_at, updated_at, deleted_at
     from schedule_events
     where deleted_at is null and date = ?`,
    [date ?? ""],
  );
  return data.map(mapRow);
}
