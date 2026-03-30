import { queryDb } from "@livestore/livestore";
import { useQuery } from "@livestore/react";
import { tables } from "@/livestore/schema";

export function useDailyNorms() {
  return useQuery(
    queryDb(
      tables.dailyNorms.where({ deletedAt: null }),
      { label: 'daily-norms' },
    ),
  );
}

export function useDailyNorm(normId: string | undefined) {
  const rows = useQuery(
    queryDb(
      tables.dailyNorms.where({ id: normId ?? "", deletedAt: null }),
      { label: `daily-norm-${normId}` },
    ),
  );
  return rows[0] ?? null;
}
