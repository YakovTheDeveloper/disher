export const getCalendarDate = (date: Date) => {
    const { day, month, year } = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
    };
    return `${day}.${month}.${year}`;
}