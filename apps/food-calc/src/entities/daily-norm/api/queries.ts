import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabase-client";
import { snakeToCamel } from "@/shared/lib/rowMapper";
import { useUserId } from "@/shared/lib/auth/useUserId";
import type { DailyNorm } from "../model/types";

const NORM_COLUMNS =
  "id, user_id, name, description, items, created_at, updated_at, deleted_at";

// jsonb arrives as parsed object — re-stringify so DailyNorm.items keeps its
// string-shape contract used by editors / DEFAULT_NORM fallback.
function normalizeItems(value: unknown): string {
  if (value == null) return "{}";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function mapRow(row: Record<string, unknown>): DailyNorm {
  const camel = snakeToCamel(row) as Record<string, unknown>;
  camel.items = normalizeItems(camel.items);
  return camel as unknown as DailyNorm;
}

async function fetchAllDailyNorms(): Promise<DailyNorm[]> {
  const { data, error } = await supabase
    .from("daily_norms")
    .select(NORM_COLUMNS)
    .is("deleted_at", null);
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as unknown as Record<string, unknown>));
}

function useAllDailyNormsQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["daily_norms", "all", userId],
    queryFn: fetchAllDailyNorms,
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}

export function useDailyNorms(): DailyNorm[] {
  const { data } = useAllDailyNormsQuery();
  return useMemo(() => data ?? [], [data]);
}

export function useDailyNorm(normId: string | undefined): DailyNorm | null {
  const { data } = useAllDailyNormsQuery();
  return useMemo(() => {
    if (!normId || !data) return null;
    return data.find((n) => n.id === normId) ?? null;
  }, [data, normId]);
}
