/**
 * Display-format a wall-clock "HH:mm" string by stripping the hour's leading
 * zero. Minutes stay two-digit — those zeros aren't "leading", they're the
 * value ("10:00" reads as ten o'clock, not "10:0").
 *
 *   "00:04" → "0:04"   "02:34" → "2:34"   "10:00" → "10:00"
 *
 * Why a string parse and not `Intl`/`toLocaleTimeString`: these are wall-clock
 * labels, not instants. Feeding them to `Intl` means synthesizing a throwaway
 * `Date` and dragging a timezone into a value that has neither — more moving
 * parts, more edge cases, for a job that's one `Number()`.
 */
export function formatClock(hhmm: string): string {
  const [h, m] = hhmm.split(':');
  if (m === undefined) return hhmm; // not "HH:mm" — leave it untouched
  return `${Number(h)}:${m}`;
}

/**
 * A time-group header: a single time ("2:34"), or a "from–to" range
 * ("2:34-2:48") with the leading zero stripped on each side.
 */
export function formatClockRange(start: string, end: string): string {
  return start === end ? formatClock(start) : `${formatClock(start)}-${formatClock(end)}`;
}
