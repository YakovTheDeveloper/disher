import { RouterLinks } from '@/app/router';
import { useCallback, useEffect, type Ref } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FoodSchedule } from '@/widgets/FoodSchedule';
import { ScheduleEvents } from '@/widgets/ScheduleEvents';
import { Laboratory } from '@/widgets/Laboratory';
import { HomeTopBar } from '@/widgets/HomeTopBar';
import { useScheduleFoods } from '@/entities/schedule-food';
import { useScheduleEvents } from '@/entities/schedule-event';
import type { ScheduleEvent } from '@/entities/schedule-event';
import { SwipeDeck, type DeckSlide } from '@/shared/ui/SwipeDeck';
import { type ScreenEntry } from '@/shared/ui/ScreenIndicator';
import { HomeHero } from './ui/HomeHero';
import { useRecentlyAddedStore } from '@/shared/model/recentlyAddedStore';
import { useRolloverNudge } from './useRolloverNudge';

// Три раздела HomePage. Плитки текстовые — декоративный арт на плитках снят
// (tile-art выпилен из проекта); единственная декор-картинка приложения — hero-
// обложка над табами, и только здесь (см. heroForSlide ниже).
const SCREENS: ScreenEntry[] = [
  { label: 'Открытия', titleStyle: 'display-sans' },
  { label: 'Рацион', titleStyle: 'display-sans' },
  { label: 'События', titleStyle: 'display-sans' },
];

const DEFAULT_SLIDE = 1;

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

  // «Недавно добавлен»-кружки живут до первого свайпа слайда или ухода со
  // страницы. Чистка идёт через zustand-стор → ре-рендерятся только сами
  // «свежие» строки, Page не подписан. Стабилен → SwipeDeck не переподписывает
  // листенеры Embla.
  const clearRecent = useCallback(() => {
    useRecentlyAddedStore.getState().clear();
  }, []);
  // Уход со страницы / смена даты — сбросить пометки.
  useEffect(() => clearRecent, [date, clearRecent]);

  // Hero-обложка над табами — живая, ТОЛЬКО на HomePage. Стабильна (useCallback)
  // → topSlot'ы в SwipeDeck мемоизируются, memo() слайдов не сбрасывается.
  const heroForSlide = useCallback((i: number) => <HomeHero slide={i} />, []);

  const renderTopBar = useCallback(
    (shellRef: Ref<HTMLDivElement>) => <HomeTopBar date={date} shellRef={shellRef} />,
    [date]
  );

  // Каждый слайд = доменный виджет, который сам владеет своим `<Screen>` и
  // получает topSlot (плитки) в `stickyTop`. `key={date}` ремонтит слайд при
  // смене даты; `topBarHide` ставит сам виджет.
  const slides: DeckSlide[] = [
    {
      // Экран 1 (Открытия→Анализ) — при скролле уезжают ВСЕ кнопки бара.
      render: (topSlot) => <Laboratory key={date} date={date} topSlot={topSlot} topBarHide="all" />,
    },
    {
      // Экран 2 (Рацион) — уезжают только настройки (нутриенты+дата нужны).
      render: (topSlot) => (
        <FoodSchedule key={date} date={date} items={items} topSlot={topSlot} topBarHide="settings" />
      ),
    },
    {
      // Экран 3 (События) — уезжают только настройки.
      render: (topSlot) => (
        <ScheduleEvents
          key={date}
          date={date}
          events={events}
          topSlot={topSlot}
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
      onIndexChange={clearRecent}
      heroForSlide={heroForSlide}
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
