import { RouterLinks } from '@/shared/config/routes';
import { useCallback, useEffect, useMemo, type Ref } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FoodSchedule } from '@/widgets/FoodSchedule';
import { ScheduleEvents } from '@/widgets/ScheduleEvents';
import { HomeTopBar } from '@/widgets/HomeTopBar';
import { useScheduleFoods } from '@/entities/schedule-food';
import { useScheduleEvents } from '@/entities/schedule-event';
import type { ScheduleEvent } from '@/entities/schedule-event';
import { SwipeDeck, type DeckSlide } from '@/shared/ui/SwipeDeck';
import { useWallpaperStore } from '@/shared/lib/wallpaper';
import { type ScreenEntry } from '@/shared/ui/ScreenIndicator';
import { Heading } from '@/shared/ui/atoms/Typography';
import { HomeHero } from './ui/HomeHero';
import { useRolloverNudge } from './useRolloverNudge';
import { formatDayHeading } from './formatDayHeading';
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

  // Per-screen высота обложки (слайд 0 = Рацион, 1 = События; тот же маппинг, что
  // SLIDE_TO_SCREEN в HomeHero). null → без override, действует responsive-клэмп.
  const heights = useWallpaperStore((s) => s.heights);
  const heroHeightForSlide = useCallback(
    (i: number) => (i === 0 ? heights.ration : heights.events) ?? undefined,
    [heights],
  );

  // Заголовок-дата («Воскресенье, 5 июля») в правом-верхнем углу листа. Владелец —
  // HomePage; один элемент прокидывается в оба экрана дека (Рацион + События) через
  // `topContent` их `Screen`. Формат — чистая `formatDayHeading` (покрыта тестом).
  const dateHeading = useMemo(() => {
    const label = formatDayHeading(date);
    if (label === null) return null;
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
      // Экран 1 (Рацион, default). Топ-бар остаётся на месте при скролле —
      // scroll-hide настроек отменён (кнопка настроек не уезжает).
      render: (topSlot) => (
        <FoodSchedule
          key={date}
          date={date}
          items={items}
          topSlot={topSlot}
          topContent={dateHeading}
        />
      ),
    },
    {
      // Экран 2 (События). Топ-бар остаётся на месте при скролле.
      render: (topSlot) => (
        <ScheduleEvents
          key={date}
          date={date}
          events={events}
          topSlot={topSlot}
          topContent={dateHeading}
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
      heroHeightForSlide={heroHeightForSlide}
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
