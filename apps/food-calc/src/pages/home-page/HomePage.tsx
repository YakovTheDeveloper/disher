import { RouterLinks } from '@/app/router';
import { useCallback, useEffect, useMemo, type Ref } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { parse, isValid, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { FoodSchedule } from '@/widgets/FoodSchedule';
import { ScheduleEvents } from '@/widgets/ScheduleEvents';
import { HomeTopBar } from '@/widgets/HomeTopBar';
import { useScheduleFoods } from '@/entities/schedule-food';
import { useScheduleEvents } from '@/entities/schedule-event';
import type { ScheduleEvent } from '@/entities/schedule-event';
import { SwipeDeck, type DeckSlide } from '@/shared/ui/SwipeDeck';
import { type ScreenEntry } from '@/shared/ui/ScreenIndicator';
import { Heading } from '@/shared/ui/atoms/Typography';
import { HomeHero } from './ui/HomeHero';
import { useRolloverNudge } from './useRolloverNudge';
import styles from './HomePage.module.scss';

// Два раздела HomePage — поверхности ВВОДА: Рацион (default) + События. Слайд
// «Открытия»/дневной разбор снят 2026-07-02 (схлопнут в /analyses, окно=1);
// вход в разбор/открытия переехал на кнопку «О!» в HomeTopBar. Плитки текстовые
// — декоративный арт на плитках снят; единственная декор-картинка приложения —
// hero-обложка над табами, и только здесь (см. heroForSlide ниже).
const SCREENS: ScreenEntry[] = [
  { label: 'Рацион', titleStyle: 'display-sans' },
  { label: 'События', titleStyle: 'display-sans' },
];

const DEFAULT_SLIDE = 0;

const Page = ({ date }: { date: string }) => {
  // Тон страницы задаёт глобальный ModalShell-вариант (App.tsx → body
  // [data-modal-fields]); своего surface нет. Обвязка (container/стекло/scroll-
  // hide/свайп/плитки) живёт в общем `SwipeDeck`.
  const scheduleFoods = useScheduleFoods(date);
  const scheduleEvents = useScheduleEvents(date);

  const items = scheduleFoods;
  // НЕ делать `[...scheduleEvents]` — spread даёт новую ссылку на каждом рендере
  // и убивает memo на ScheduleEvents.
  const events = scheduleEvents as ScheduleEvent[];

  // Hero-обложка над табами — живая, ТОЛЬКО на HomePage. Стабильна (useCallback)
  // → topSlot'ы в SwipeDeck мемоизируются, memo() слайдов не сбрасывается.
  const heroForSlide = useCallback((i: number) => <HomeHero slide={i} />, []);

  // Заголовок-дата (крупное имя дня недели) в правом-верхнем углу листа. Владелец —
  // HomePage; один элемент прокидывается в оба экрана дека (Рацион + События) через
  // `topContent` их `Screen`. Капитализуем ТОЛЬКО первую букву вручную (CSS
  // `capitalize` заглавил бы лишнее).
  const dateHeading = useMemo(() => {
    const parsed = parse(date, 'dd-MM-yyyy', new Date());
    if (!isValid(parsed)) return null;
    const weekday = format(parsed, 'EEEE', { locale: ru });
    const label = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return (
      <Heading role="title" as="h2" className={styles.dateHeading}>
        {label}
      </Heading>
    );
  }, [date]);

  const renderTopBar = useCallback(
    (shellRef: Ref<HTMLDivElement>) => (
      <HomeTopBar date={date} shellRef={shellRef} hubDate={date} />
    ),
    [date]
  );

  // Каждый слайд = доменный виджет, который сам владеет своим `<Screen>` и
  // получает topSlot (плитки) в `stickyTop`. `key={date}` ремонтит слайд при
  // смене даты; `topBarHide` ставит сам виджет.
  const slides: DeckSlide[] = [
    {
      // Экран 1 (Рацион, default) — уезжают только настройки (нутриенты+дата нужны).
      render: (topSlot) => (
        <FoodSchedule
          key={date}
          date={date}
          items={items}
          topSlot={topSlot}
          topContent={dateHeading}
          topBarHide="settings"
        />
      ),
    },
    {
      // Экран 2 (События) — уезжают только настройки.
      render: (topSlot) => (
        <ScheduleEvents
          key={date}
          date={date}
          events={events}
          topSlot={topSlot}
          topContent={dateHeading}
          topBarHide="settings"
        />
      ),
    },
  ];

  return (
    <SwipeDeck
      screens={SCREENS}
      slides={slides}
      defaultSlide={DEFAULT_SLIDE}
      renderTopBar={renderTopBar}
      heroForSlide={heroForSlide}
      // Дек стал 2-слайдовым (Рацион ↔ События) — «middle-right» больше не имеет
      // среднего слайда, так что дефолт 'all': у неактивного соседа стрелка в его
      // сторону (вправо на «Рацион», влево на «События»).
      arrowHint="all"
    />
  );
};

const GetDatePageWrapper = () => {
  const params = useParams();
  const date = params.id;
  const navigate = useNavigate();

  // Если день перевалил за полночь, пока приложение было в фоне, а юзер «следил
  // за сегодня» — мягко предлагаем тостером перейти на новое сегодня.
  useRolloverNudge(date);

  useEffect(() => {
    if (!date) {
      navigate(RouterLinks.Root);
    } else {
      sessionStorage.setItem('lastScheduleBuilderId', date);
      localStorage.setItem('lastVisitedScheduleDate', date);
    }
  }, [date]);

  if (!date) return null;

  return <Page date={date} />;
};

export default GetDatePageWrapper;
