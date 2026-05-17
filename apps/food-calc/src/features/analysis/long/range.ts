import {
  addDays,
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
  startOfDay,
  subDays,
} from 'date-fns';

// Pure window helpers for the long analysis — no React, no react-day-picker,
// so they (and the restart logic) stay cheap to import and unit-test.

/** Presets — the number of days the window covers. Window = [end − (N−1), end],
 *  i.e. N inclusive calendar days ending on `end`. */
export const RANGE_PRESETS = [7, 14, 21, 28, 35] as const;
export const MIN_WINDOW_DAYS = 7;
export const MAX_WINDOW_DAYS = 35;
/** How far back the end date may sit on the calendar (retro picker bound). */
export const MAX_RETRO_DAYS = 30;

/** Canonical range — `yyyy-MM-dd` strings (timezone-free, server-parseable). */
export type DateRange = { start: string; end: string };

export const toKey = (d: Date): string => format(d, 'yyyy-MM-dd');

/**
 * Number of calendar days the window covers — INCLUSIVE of both ends. A
 * one-date window is 1 day; `25-03 … 01-04` is 8. NaN if either side is
 * unparseable. The «7 дней» preset chip must agree with this count, so it is
 * `differenceInCalendarDays + 1`, not the raw difference.
 */
export function windowSpanDays(range: DateRange): number {
  const s = parseISO(range.start);
  const e = parseISO(range.end);
  if (!isValid(s) || !isValid(e)) return NaN;
  return differenceInCalendarDays(e, s) + 1;
}

/** A range the long analysis will accept — span inside [7, 35], end ≥ start. */
export function isValidWindow(range: DateRange): boolean {
  const span = windowSpanDays(range);
  return (
    Number.isFinite(span) && span >= MIN_WINDOW_DAYS && span <= MAX_WINDOW_DAYS
  );
}

/**
 * `dd-MM-yyyy` keys for every day in [start, end] inclusive — feeds the Dexie
 * collectors (`collectFoods` / `collectEvents` key schedule rows by date).
 */
export function rangeDayKeys(range: DateRange): string[] {
  const s = parseISO(range.start);
  const e = parseISO(range.end);
  if (!isValid(s) || !isValid(e)) return [];
  const keys: string[] = [];
  for (let d = startOfDay(s); d <= e; d = addDays(d, 1)) {
    keys.push(format(d, 'dd-MM-yyyy'));
  }
  return keys;
}

/** Default range — last 14 days (inclusive) ending today. */
export function defaultRange(): DateRange {
  const end = startOfDay(new Date());
  return { start: toKey(subDays(end, 13)), end: toKey(end) };
}
