import { RouterLinks } from '@/app/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Swipeable, type SwipeableRef } from '@/shared/ui/Swipeable';
import homeStyles from './HomePage.module.scss';
import { FoodSchedule } from '@/widgets/FoodSchedule';
import { ScheduleEvents } from '@/widgets/ScheduleEvents';
import { Laboratory } from '@/widgets/Laboratory';
import { HomeTopBar } from '@/widgets/HomeTopBar';
import { useScheduleFoods, useScheduleNutrientTotals } from '@/entities/schedule-food';
import { useScheduleEvents } from '@/entities/schedule-event';
import type { ScheduleEvent } from '@/entities/schedule-event';
import { ScreenIndicator, type ScreenEntry } from '@/shared/ui/ScreenIndicator';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import normsImg from '@/shared/assets/decarative/norms.png';

const SCREENS: ScreenEntry[] = [
  { label: 'Лаборатория', image: '/art/experiment.png', titleStyle: 'display-sans' },
  { label: 'Приемы пищи', image: '/art/schedule-food.png', titleStyle: 'display-sans' },
  { label: 'События', image: normsImg, titleStyle: 'display-sans' },
];

const DEFAULT_SLIDE = 1;
// Ambient backdrop варианты — radial-glow подложки на `.container`. CSS
// живёт в HomePage.module.scss (`[data-dv='HomeAmbient']`).
const HOME_AMBIENT_VARIANTS = [
  'plain',
  'peach-rose',
  'mint-sky',
  'lavender-cream',
  'sunrise',
] as const;
// Embla programmatic-scroll duration (frame-loop units). Сокращён
// относительно дефолта 25, потому что юзер добавил margin между слайдами:
// scroll-дистанция выросла → spring-кривая Embla в конце давала visible
// drop ("11111110099"). Меньшее окно (~300ms) делает spring менее заметным.
// На пользовательский свайп не влияет — там momentum, не `duration`.
const SWIPE_DURATION = 18;

const Page = ({ date }: { date: string }) => {
  const scheduleFoods = useScheduleFoods(date);
  const scheduleEvents = useScheduleEvents(date);
  const {
    totals: scheduleTotals,
    missingNutrientNames,
    isLoading: nutrientsLoading,
  } = useScheduleNutrientTotals(date);

  const items = scheduleFoods;
  // НЕ делать `[...scheduleEvents]` — spread даёт новую ссылку на каждом
  // рендере HomePage и убивает memo на ScheduleEvents (props всегда «новые»).
  const events = scheduleEvents as ScheduleEvent[];

  const [activeIndex, setActiveIndex] = useState(DEFAULT_SLIDE);
  const swipeableRef = useRef<SwipeableRef>(null);

  // Preload bandImg PNG'шек: на первый клик по тайлу image уже в HTTP-кеше,
  // decode <1ms → CSS-fade стартует на готовых пикселях, нет "pop"
  // (cold-cache decode ~50-150ms на iOS WebKit съедал первую часть
  // opacity-анимации).
  useEffect(() => {
    SCREENS.forEach((s) => {
      if (!s.image) return;
      const img = new Image();
      img.src = s.image;
    });
  }, []);

  const { anchor: ambientAnchor } = useDesignVariant(
    'HomeAmbient',
    HOME_AMBIENT_VARIANTS,
  );

  // На свайпе VT-морф title НЕ запускаем намеренно — Swipeable вызывает
  // onIndexChange на `settle` event (после полного завершения scroll-
  // анимации), и пуск 600ms VT в этот момент даёт perceived "title застрял":
  // контент уже на новой позиции, а title только начинает морфить. Свайп =
  // utility (instant title), click = декор (VT-морф внутри ScreenIndicator).
  const handleIndexChange = useCallback((idx: number) => {
    setActiveIndex(idx);
  }, []);

  const handleSelect = useCallback((idx: number) => {
    swipeableRef.current?.goToPage(idx);
    setActiveIndex(idx);
  }, []);

  // ScreenIndicator передаётся в каждый слайд как `topSlot`. Sticky-обёртка
  // в `Screen.screenScroll` резервирует своё место в потоке — контент идёт
  // после него без `padding-top`-компенсации. VT-имена и runTileMigration
  // живут только в активной копии (см. ScreenIndicator.isActive prop) —
  // иначе VT API ругается на дубликаты `view-transition-name`.
  //
  // useMemo — каждый виджет слайда обёрнут в memo(...); нестабильный JSX
  // в `topSlot` бы ломал memoization. Зависимости — activeIndex (active
  // changes) + handleSelect (stable через useCallback).
  // slideIndex={0/1/2} → каждый инстанс показывает СВОЙ статичный экран
  // (label, image, highlight'нутый тайл) и не реагирует на activeIndex.
  // При свайпе юзер видит title слайда A → пролистывает → title слайда B
  // через нативную DOM-смену слайдов, без cross-fade морфа.
  const labIndicator = useMemo(
    () => (
      <ScreenIndicator
        screens={SCREENS}
        activeIndex={activeIndex}
        onSelect={handleSelect}
        isActive={activeIndex === 0}
        slideIndex={0}
      />
    ),
    [activeIndex, handleSelect],
  );
  const foodIndicator = useMemo(
    () => (
      <ScreenIndicator
        screens={SCREENS}
        activeIndex={activeIndex}
        onSelect={handleSelect}
        isActive={activeIndex === 1}
        slideIndex={1}
      />
    ),
    [activeIndex, handleSelect],
  );
  const eventsIndicator = useMemo(
    () => (
      <ScreenIndicator
        screens={SCREENS}
        activeIndex={activeIndex}
        onSelect={handleSelect}
        isActive={activeIndex === 2}
        slideIndex={2}
      />
    ),
    [activeIndex, handleSelect],
  );

  return (
    <div className={homeStyles.container} {...ambientAnchor}>
      <HomeTopBar date={date} />
      <div className={homeStyles.swipeArea}>
        <Swipeable
          ref={swipeableRef}
          defaultSlide={DEFAULT_SLIDE}
          duration={SWIPE_DURATION}
          hasDots={false}
          onIndexChange={handleIndexChange}
        >
          <Laboratory key={date} date={date} topSlot={labIndicator} />
          <FoodSchedule
            key={date}
            date={date}
            items={items}
            totals={scheduleTotals}
            missingNutrientNames={missingNutrientNames}
            isLoading={nutrientsLoading}
            topSlot={foodIndicator}
          />
          <ScheduleEvents
            key={date}
            date={date}
            events={events}
            topSlot={eventsIndicator}
          />
        </Swipeable>
      </div>
    </div>
  );
};

const GetDatePageWrapper = () => {
  const params = useParams();
  const date = params.id;
  const navigate = useNavigate();

  useEffect(() => {
    if (!date) {
      navigate(RouterLinks.ScheduleDateSelection);
    } else {
      sessionStorage.setItem('lastScheduleBuilderId', date);
      localStorage.setItem('lastVisitedScheduleDate', date);
    }
  }, [date]);

  if (!date) return null;

  return <Page date={date} />;
};

export default GetDatePageWrapper;
