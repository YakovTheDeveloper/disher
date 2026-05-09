import type { ScheduleEventRow } from '@/shared/lib/dexie/schema';
import type { ScheduleEvent } from '../model/types';
import { isValidAtom, type Atom } from '../model/atoms';

function parseAtoms(value: unknown): Atom[] {
  if (Array.isArray(value)) return value.filter(isValidAtom);
  if (typeof value !== 'string' || value.length === 0) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isValidAtom) : [];
  } catch {
    return [];
  }
}

export function mapScheduleEventRow(row: ScheduleEventRow): ScheduleEvent {
  return {
    id: row.id,
    date: row.date,
    time: row.time,
    endTime: row.end_time ?? '',
    text: row.text ?? '',
    atoms: parseAtoms(row.atoms),
    createdAt: row.created_at,
  };
}
