import { parse, isValid } from 'date-fns';

// Заголовок дня недели для даты в формате dd-MM-yyyy. Intl возвращает
// lowercase в ru-RU («понедельник»), поэтому капитализируем первый символ
// вручную. Используется в HomePage (ScreenIndicator title) и FoodSchedule
// (sub-heading в начале scroll-области).
export const formatWeekdayTitle = (input: string): string => {
  const date = parse(input, 'dd-MM-yyyy', new Date());
  if (!isValid(date)) return '';
  const weekday = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(date);
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
};
