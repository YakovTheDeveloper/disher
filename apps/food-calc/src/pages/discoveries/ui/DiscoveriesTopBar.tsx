import { memo, type Ref } from 'react';
import { format } from 'date-fns';
import { HomeTopBar } from '@/widgets/HomeTopBar';
import { BackButton } from '@/shared/ui/atoms/Button/BackButton';
import CalendarIcon from '@/shared/assets/icons/calendar.svg?react';

// Обвязка «Открытий» — общий `HomeTopBar` (как Analyses/Dish). Слоты: back на
// главную (cover-анимация), AccountPanel (встроен) и иконка-календарь справа →
// ScheduleNavigator → /schedule/<date>. `shellRef` приходит из SwipeDeck для
// scroll-hide кнопок. `noInterruptGuard` глушит date-switch confirm.
type Props = { shellRef?: Ref<HTMLDivElement> };

const DiscoveriesTopBar = ({ shellRef }: Props) => {
  // last-visited дата расписания (для календаря). Читаем в рендере, не
  // `useMemo([],)` — чтобы не замораживать значение на весь lifetime страницы.
  const date =
    (typeof window !== 'undefined' && window.localStorage.getItem('lastVisitedScheduleDate')) ||
    format(new Date(), 'dd-MM-yyyy');

  return (
    <HomeTopBar
      date={date}
      backSlot={<BackButton to="/" type="cover-back" ariaLabel="На главную" />}
      dateButtonLabel={<CalendarIcon width={22} height={22} />}
      noInterruptGuard
      shellRef={shellRef}
    />
  );
};

export default memo(DiscoveriesTopBar);
