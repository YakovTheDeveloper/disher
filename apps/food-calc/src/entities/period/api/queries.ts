import { queryDb } from "@livestore/livestore";
import { useQuery } from "@livestore/react";
import { tables } from "@/livestore/schema";

const allPeriods$ = queryDb(tables.periods.where({ deletedAt: null }), { label: 'periods' });

export function usePeriods() {
  return useQuery(allPeriods$);
}
