export interface TimeBasedItem {
    time: string; // HH:mm
}
export interface TimeGroupUI<T> {
    time: string;
    items: T[];
    offset: { hours: number; minutes: number } | null;
}

export function groupItemsByTime<T extends TimeBasedItem>(
    items: readonly T[]
): TimeGroupUI<T>[] {
    const sorted = [...items].sort((a, b) =>
        a.time.localeCompare(b.time) // HH:mm safe
    );

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
                prevTimeMinutes == null
                    ? null
                    : currentMinutes - prevTimeMinutes;

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
