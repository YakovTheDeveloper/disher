import { parse, isValid, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { capitalizeFirst } from '@/shared/lib/text/capitalizeFirst';

// Лист-заголовок даты в правом-верхнем углу Screen: «Воскресенье, 5 июля» — имя дня
// недели + число + месяц (date-fns отдаёт месяц в родительном падеже: «июля»).
// Капитализуем ТОЛЬКО первую букву вручную (CSS `capitalize` заглавил бы и месяц).
// null на невалидной дате. Вынесено модуль-уровнем чистой функцией, чтобы формат был
// покрыт юнит-тестом и не откатился тихо на голый `EEEE` (см. formatDayHeading.test).
export const formatDayHeading = (date: string): string | null => {
  const parsed = parse(date, 'dd-MM-yyyy', new Date());
  if (!isValid(parsed)) return null;
  const formatted = format(parsed, 'EEEE, d MMMM', { locale: ru });
  return capitalizeFirst(formatted);
};
