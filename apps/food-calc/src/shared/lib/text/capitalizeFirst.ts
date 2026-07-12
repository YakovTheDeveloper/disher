// Первая буква в верхний регистр (имена продуктов/блюд приходят строчными,
// напр. «абрикос»). НЕ locale (`toUpperCase`, не `toLocaleUpperCase`) — 1:1 с
// прежними инлайнами; для кириллицы разницы нет. Пустая строка → ''.
// Отличается от CSS `text-transform: capitalize` (тот заглавил бы КАЖДОЕ слово —
// см. formatDayHeading, где месяц должен остаться строчным).
export const capitalizeFirst = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
