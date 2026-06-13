import { memo } from 'react';
import { parse, isValid, isToday, isYesterday, isTomorrow, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';

// Дата хранится в Dexie-формате `dd-MM-yyyy` (тот же, что schedule-navigator/lib.ts).
const DATE_FORMAT = 'dd-MM-yyyy';

// Относительные дни — словом («Сегодня/Вчера/Завтра»), прочие — «5 июня»
// (родительный падеж, строчными, без ведущего нуля). '' для невалидной даты,
// чтобы заголовок просто не рендерился.
function selectedDayLabel(input: string): string {
  const date = parse(input, DATE_FORMAT, new Date());
  if (!isValid(date)) return '';
  if (isToday(date)) return 'Сегодня';
  if (isYesterday(date)) return 'Вчера';
  if (isTomorrow(date)) return 'Завтра';
  return format(date, 'd MMMM', { locale: ru });
}

type Props = {
  /** Выбранный день в формате `dd-MM-yyyy`. */
  date: string;
};

/**
 * Заголовок выбранного дня для слота под плитками `ScreenIndicator` на
 * HomePage. Типографика — общий `<Heading size="section">` (как Screen
 * `contentHeader`). Создан по месту использования (home-page/ui).
 */
export const SelectedDayHeading = memo(({ date }: Props) => {
  const label = selectedDayLabel(date);
  if (!label) return null;
  return <Heading size="section">{label}</Heading>;
});

SelectedDayHeading.displayName = 'SelectedDayHeading';

export default SelectedDayHeading;
