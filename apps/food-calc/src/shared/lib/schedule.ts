/**
 * Schedule utility functions — grouping items by time for UI display.
 */

export interface TimeBasedItem {
  time: string; // HH:mm
}

export interface TimeGroupUI<T> {
  time: string;
  items: T[];
  offset: { hours: number; minutes: number } | null;
}

/**
 * Groups schedule items by time, sorted chronologically.
 * Calculates time offset between consecutive groups for UI display.
 */
export function groupItemsByTime<T extends TimeBasedItem>(
  items: readonly T[],
): TimeGroupUI<T>[] {
  const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));

  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const groups: TimeGroupUI<T>[] = [];
  let prevTimeMinutes: number | null = null;

  for (const item of sorted) {
    const currentMinutes = toMinutes(item.time);
    let group = groups[groups.length - 1];

    if (!group || group.time !== item.time) {
      const diff =
        prevTimeMinutes == null ? null : currentMinutes - prevTimeMinutes;

      group = {
        time: item.time,
        items: [],
        offset:
          diff === null
            ? null
            : {
                hours: Math.floor(diff / 60),
                minutes: diff % 60,
              },
      };

      groups.push(group);
      prevTimeMinutes = currentMinutes;
    }

    group.items.push(item);
  }

  return groups;
}

/**
 * Returns the index at which a "now" marker should be inserted between time groups.
 * Items at index >= nowIndex are in the future.
 * Returns -1 if all groups are in the future, or groups.length if all are in the past.
 * Only meaningful when `date` is today.
 */
export function getNowMarkerIndex<T extends TimeBasedItem>(
  groups: TimeGroupUI<T>[],
  date: string,
): number {
  // Check if date is today (format: dd-MM-yyyy)
  const today = new Date();
  const [dd, mm, yyyy] = date.split('-').map(Number);
  if (
    today.getDate() !== dd ||
    today.getMonth() + 1 !== mm ||
    today.getFullYear() !== yyyy
  ) {
    return -1;
  }

  const nowMinutes = today.getHours() * 60 + today.getMinutes();

  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  // Find the first group whose time is strictly after now
  for (let i = 0; i < groups.length; i++) {
    if (toMinutes(groups[i].time) > nowMinutes) {
      return i;
    }
  }

  return groups.length;
}
