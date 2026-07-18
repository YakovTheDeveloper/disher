/**
 * Schedule utility functions — grouping items by time for UI display.
 */

export interface TimeBasedItem {
  time: string; // HH:mm
}

export interface TimeGroupUI<T> {
  startTime: string;
  endTime: string;
  items: T[];
  offset: { hours: number; minutes: number } | null;
}

// 15 = "один приём пищи с догрызаниями". UX-вкус, не точность.
const TIME_CLUSTER_GAP_MIN = 15;

const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Groups schedule items into time clusters using single-linkage on a 1D
 * timeline: consecutive items within TIME_CLUSTER_GAP_MIN of the cluster's
 * last item merge into it. Offset between clusters is measured end-of-prev
 * to start-of-next (a "gap between meals", not "from-start-to-start").
 */
export function groupItemsByTime<T extends TimeBasedItem>(
  items: readonly T[],
): TimeGroupUI<T>[] {
  const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));

  const groups: TimeGroupUI<T>[] = [];

  for (const item of sorted) {
    const currentMinutes = toMinutes(item.time);
    const lastGroup = groups[groups.length - 1];
    const lastEndMinutes = lastGroup ? toMinutes(lastGroup.endTime) : null;

    if (
      lastGroup &&
      lastEndMinutes !== null &&
      currentMinutes - lastEndMinutes <= TIME_CLUSTER_GAP_MIN
    ) {
      lastGroup.items.push(item);
      if (currentMinutes > lastEndMinutes) {
        lastGroup.endTime = item.time;
      }
      continue;
    }

    const offset =
      lastEndMinutes === null
        ? null
        : {
            hours: Math.floor((currentMinutes - lastEndMinutes) / 60),
            minutes: (currentMinutes - lastEndMinutes) % 60,
          };

    groups.push({
      startTime: item.time,
      endTime: item.time,
      items: [item],
      offset,
    });
  }

  return groups;
}
