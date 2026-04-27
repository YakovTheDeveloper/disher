import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabase-client";
import { snakeToCamel } from "@/shared/lib/rowMapper";
import { useUserId } from "@/shared/lib/auth/useUserId";

export interface Period {
  id: string;
  userId: string;
  name: string;
  colorIndex: number;
  fontFamily: string;
  fontSize: number;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

const PERIOD_COLUMNS =
  "id, user_id, name, color_index, font_family, font_size, " +
  "created_at, updated_at, deleted_at";

function mapRow(row: Record<string, unknown>): Period {
  return snakeToCamel(row) as unknown as Period;
}

async function fetchAllPeriods(): Promise<Period[]> {
  const { data, error } = await supabase
    .from("periods")
    .select(PERIOD_COLUMNS)
    .is("deleted_at", null);
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as unknown as Record<string, unknown>));
}

export function usePeriods(): Period[] {
  const userId = useUserId();
  const { data } = useQuery({
    queryKey: ["periods", "all", userId],
    queryFn: fetchAllPeriods,
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
  return useMemo(() => data ?? [], [data]);
}
