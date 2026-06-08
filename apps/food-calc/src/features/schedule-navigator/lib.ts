import { format, isBefore, parse, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { DateStr } from './model';

export const DATE_FORMAT = 'dd-MM-yyyy';

export interface ParsedDay {
  date: Date;
  dateStr: DateStr;
}

export interface MonthGroup {
  key: string;
  /** Month name only, e.g. "май". Rendered with the year as "май'26". */
  name: string;
  /** 2-digit year, e.g. "26". */
  year: string;
  items: ParsedDay[];
}

/**
 * Parse Dexie's `dd-MM-yyyy` keys into Date objects and sort ascending.
 * Dexie's `orderBy('date')` is lexicographic on strings, which is wrong for
 * day-first format ("31-01-2026" > "01-12-2025" lexically but earlier in
 * time), so we re-sort here on real Date values.
 */
export function parseKeys(keys: DateStr[] | undefined): ParsedDay[] {
  if (!keys || keys.length === 0) return [];
  return keys
    .map((dateStr) => ({ date: parse(dateStr, DATE_FORMAT, new Date()), dateStr }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Days strictly before yesterday — sorted asc. Yesterday itself is always
 * rendered in the anchor block (yesterday/today/tomorrow), never duplicated
 * in the past list.
 */
export function computePastFilledAsc(filledAsc: ParsedDay[], today: Date): ParsedDay[] {
  const yesterday = subDays(today, 1);
  return filledAsc.filter((d) => isBefore(d.date, yesterday));
}

/**
 * Group consecutive days by year-month, preserving input order. Each group
 * carries the Russian month name ("май") and a 2-digit year ("26"), rendered
 * as "май'26" by the UI. Use with ASC-sorted input so months ascend with the
 * list.
 */
export function groupByMonth(days: ParsedDay[]): MonthGroup[] {
  const out: MonthGroup[] = [];
  let current: MonthGroup | null = null;
  for (const d of days) {
    const key = format(d.date, 'yyyy-MM');
    if (!current || current.key !== key) {
      current = {
        key,
        name: format(d.date, 'LLLL', { locale: ru }),
        year: format(d.date, 'yy'),
        items: [],
      };
      out.push(current);
    }
    current.items.push(d);
  }
  return out;
}
