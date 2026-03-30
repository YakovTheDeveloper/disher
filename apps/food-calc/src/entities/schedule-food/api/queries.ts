import { queryDb } from "@livestore/livestore";
import { useQuery } from "@livestore/react";
import { tables } from "@/livestore/schema";

export function useScheduleFoods(date: string | undefined) {
  const rows = useQuery(
    queryDb(
      tables.scheduleFoods.where({ date: date ?? "", deletedAt: null }),
      { label: `schedule-foods-${date}` },
    ),
  );
  return rows;
}

export function useScheduleFoodsByDates(dates: string[]) {
  const rows = useQuery(
    queryDb(
      tables.scheduleFoods.where({ deletedAt: null }),
      { label: 'schedule-foods-all' },
    ),
  );
  const dateSet = new Set(dates);
  return rows.filter((r: any) => dateSet.has(r.date));
}

export function useAllScheduleFoods() {
  const rows = useQuery(
    queryDb(
      tables.scheduleFoods.where({ deletedAt: null }),
      { label: 'all-schedule-foods' },
    ),
  );
  return rows;
}
