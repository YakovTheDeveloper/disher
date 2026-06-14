import { memo, useMemo } from 'react';
import { format } from 'date-fns';
import { HomeTopBar } from '@/widgets/HomeTopBar';
import { BackButton } from '@/shared/ui/atoms/Button/BackButton';
import CalendarIcon from '@/shared/assets/icons/calendar.svg?react';

// Обвязка «Открытий» — общий `HomeTopBar` (как AnalysesPage / DishPage). Слоты:
// back на главную (cover-анимация), AccountPanel (встроен) и иконка-календарь
// справа → ScheduleNavigator → /schedule/<date>. Сводки нутриентов нет, поэтому
// centerSlot не передаём. `date` — last-visited дата расписания (для календаря);
// `noInterruptGuard` глушит date-switch confirm (мы не стоим на этой дате).
const DiscoveriesTopBar = () => {
  const date = useMemo(() => {
    if (typeof window === 'undefined') return format(new Date(), 'dd-MM-yyyy');
    return (
      window.localStorage.getItem('lastVisitedScheduleDate') ??
      format(new Date(), 'dd-MM-yyyy')
    );
  }, []);

  return (
    <HomeTopBar
      date={date}
      backSlot={<BackButton to="/" type="cover-back" ariaLabel="На главную" />}
      dateButtonLabel={<CalendarIcon width={22} height={22} />}
      noInterruptGuard
    />
  );
};

export default memo(DiscoveriesTopBar);
