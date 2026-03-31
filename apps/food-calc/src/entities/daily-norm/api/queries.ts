import { queryDb } from "@livestore/livestore";
import { useQuery } from "@livestore/react";
import { tables } from "@/livestore/schema";

const allDailyNorms$ = queryDb(tables.dailyNorms.where({ deletedAt: null }), { label: 'daily-norms' });

export function useDailyNorms() {
  return useQuery(allDailyNorms$);
}

export function useDailyNorm(normId: string | undefined) {
  const rows = useQuery(
    queryDb(
      tables.dailyNorms.where({ id: normId ?? "", deletedAt: null }),
      { label: `daily-norm-${normId}`, deps: [normId] },
    ),
  );
  return rows[0] ?? null;
}
