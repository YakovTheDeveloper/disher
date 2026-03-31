import { queryDb } from "@livestore/livestore";
import { useQuery } from "@livestore/react";
import { tables } from "@/livestore/schema";

export function useScheduleEvents(date: string | undefined) {
  return useQuery(
    queryDb(
      tables.scheduleEvents.where({ date: date ?? "", deletedAt: null }),
      { label: `schedule-events-${date}`, deps: [date] },
    ),
  );
}
