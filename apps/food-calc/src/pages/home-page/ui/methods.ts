import { DDMMYYYY } from "@/types/common/timeAndDate";
import { parse, isValid } from 'date-fns';

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

export const getTitle = (input: DDMMYYYY) => {
    const date = parse(input, 'dd-MM-yyyy', new Date());

    if (!isValid(date)) {
        throw new Error(`Invalid date: ${input}`);
    }

    const day = date.getDate();
    const monthNumber = String(date.getMonth() + 1).padStart(2, '0');

    const monthName = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(date);
    const weekdayName = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(date);
    const weekdayNameShort = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(date);

    return { day, monthNumber, monthName, weekdayName, weekdayNameShort };
};
