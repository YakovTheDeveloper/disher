
export const nextDate = (currentDateISO: string) => {
    const date = new Date(currentDateISO);
    date.setDate(date.getDate() + 1);
    return date.toISOString();
};

export const prevDate = (currentDateISO: string) => {
    const date = new Date(currentDateISO);
    date.setDate(date.getDate() - 1);
    return date.toISOString();
};

export const getTitle = (input: string) => {
    const date = new Date(input);
    const day = date.getUTCDate();
    const monthName = new Intl.DateTimeFormat('ru-RU', { month: 'long', timeZone: 'UTC' }).format(
        date
    );
    const monthNumber = new Intl.DateTimeFormat('ru-RU', {
        month: '2-digit',
        timeZone: 'UTC',
    }).format(date);
    const weekdayName = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', timeZone: 'UTC' }).format(
        date
    );
    const weekdayNameShort = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', timeZone: 'UTC' }).format(
        date
    );

    return { day, monthNumber, monthName, weekdayName, weekdayNameShort };
};