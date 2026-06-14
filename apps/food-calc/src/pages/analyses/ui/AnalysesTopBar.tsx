import { memo, useMemo } from 'react';
import { format } from 'date-fns';
import { HomeTopBar } from '@/widgets/HomeTopBar';
import { BackButton } from '@/shared/ui/atoms/Button/BackButton';
import CalendarIcon from '@/shared/assets/icons/calendar.svg?react';

// Обвязка AnalysesPage — общий `HomeTopBar` (как DishPage), а не bespoke-бар.
// Слоты: back на главную (cover-анимация — зеркало входа: AnalysesPage съезжает
// вниз, HomePage возвращается из scale .94; PUSH на '/' анимируется, popstate —
// нет), AccountPanel (аккаунт/настройки, встроен в HomeTopBar) и иконка-календарь
// справа → ScheduleNavigator → /schedule/<date>. Нутриентов НЕТ (у экрана
// разборов нет сводки), поэтому centerSlot не передаём.
//
// `date` — last-visited дата расписания (как на Dish): нужна только чтобы у бара
// было значение и календарь знал, куда вести. `noInterruptGuard` глушит
// date-switch confirm (мы не стоим на этой дате).
const AnalysesTopBar = () => {
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

export default memo(AnalysesTopBar);
