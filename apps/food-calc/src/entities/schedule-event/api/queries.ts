import { useQuery } from "@triplit/react";
import { triplit } from "@/api/triplit/client";

export function useScheduleEvents(date: string | undefined) {
  return useQuery(
    triplit,
    triplit
      .query("scheduleEvents")
      .Where("date", "=", date ?? ""),
  );
}
