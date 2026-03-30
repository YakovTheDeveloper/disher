import { queryDb } from "@livestore/livestore";
import { useQuery } from "@livestore/react";
import { tables } from "@/livestore/schema";

export function usePeriods() {
  return useQuery(
    queryDb(
      tables.periods.where({ deletedAt: null }),
      { label: 'periods' },
    ),
  );
}
