import { useQuery } from "@powersync/react";
import { snakeToCamel } from "@/shared/lib/rowMapper";
import type { ScheduleEvent } from "../model/types";
import { isValidAtom, type Atom } from "../model/atoms";

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

export function useScheduleEvents(date: string | undefined): ScheduleEvent[] {
  const { data } = useQuery<Record<string, unknown>>(
    `select id, user_id, date, time, end_time, text, atoms,
            created_at, updated_at, deleted_at
     from schedule_events
     where deleted_at is null and date = ?`,
    [date ?? ""],
  );
  return data.map(mapRow);
}
