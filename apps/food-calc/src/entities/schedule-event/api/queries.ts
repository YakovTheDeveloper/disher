import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabase-client";
import { snakeToCamel } from "@/shared/lib/rowMapper";
import { useUserId } from "@/shared/lib/auth/useUserId";
import type { ScheduleEvent } from "../model/types";
import { isValidAtom, type Atom } from "../model/atoms";

const SE_COLUMNS =
  "id, user_id, date, time, end_time, text, atoms, " +
  "created_at, updated_at, deleted_at";

function parseAtoms(value: unknown): Atom[] {
  if (Array.isArray(value)) return value.filter(isValidAtom);
  if (typeof value !== "string" || value.length === 0) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isValidAtom) : [];
  } catch {
    return [];
  }
}

function mapRow(row: Record<string, unknown>): ScheduleEvent {
  const camel = snakeToCamel(row) as Record<string, unknown>;
  return { ...camel, atoms: parseAtoms(camel.atoms) } as unknown as ScheduleEvent;
}

async function fetchAllScheduleEvents(): Promise<ScheduleEvent[]> {
  const { data, error } = await supabase
    .from("schedule_events")
    .select(SE_COLUMNS)
    .is("deleted_at", null);
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as unknown as Record<string, unknown>));
}

function useAllScheduleEventsQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["schedule_events", "all", userId],
    queryFn: fetchAllScheduleEvents,
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}

export function useScheduleEvents(date: string | undefined): ScheduleEvent[] {
  const { data } = useAllScheduleEventsQuery();
  return useMemo(() => {
    if (!date || !data) return [];
    return data.filter((r) => r.date === date);
  }, [data, date]);
}
