export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

/**
 * Определяет время суток на основе часа.
 * Диапазоны:
 * - Утро: 6-12
 * - День: 12-17
 * - Вечер: 17-23
 * - Ночь: 23-6
 * 
 * @param time - Строка времени в формате "HH:MM" или объект Date
 */
export const getTimeOfDay = (time: string | Date = new Date()): TimeOfDay => {
    let hour: number;

    if (typeof time === 'string') {
        // Парсим строку формата "HH:MM"
        const [hoursStr] = time.split(':');
        hour = parseInt(hoursStr, 10);
    } else {
        hour = time.getHours();
    }

    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'day';
    if (hour >= 17 && hour < 23) return 'evening';
    return 'night';
};
