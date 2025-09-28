export function groupByTimeAndSort<T>(items: (T & { time: string })[]) {
    const sorted = items.slice().sort((a, b) =>
        a.time.localeCompare(b.time) // works for HH:mm format
    );

    const toMinutes = (t: string) => {
        const [hours, minutes] = t.split(":").map(Number);
        return hours * 60 + minutes;
    };

    const groups: {
        time: string;
        items: T[];
        offset: { hours: number; minutes: number } | null;
    }[] = [];

    let prevTimeMinutes: number | null = null;

    for (const item of sorted) {
        const currentMinutes = toMinutes(item.time);
        let group = groups[groups.length - 1];

        if (!group || group.time !== item.time) {
            const diff = prevTimeMinutes == null ? null : currentMinutes - prevTimeMinutes;

            group = {
                time: item.time,
                items: [],
                offset: diff === null
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