/**
 * Maps a time string (HH:mm) to a time-of-day period.
 * Used for gradient color theming of schedule items.
 */

export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

/**
 * Morning: 06:00–11:59
 * Day:     12:00–17:59
 * Evening: 18:00–22:59
 * Night:   23:00–05:59
 */
export function getTimeOfDay(time: string): TimeOfDay {
  const [h] = time.split(':').map(Number);
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'day';
  if (h >= 18 && h < 23) return 'evening';
  return 'night';
}
