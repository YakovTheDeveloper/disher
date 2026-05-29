import { RouterLinks } from '@/app/router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatWeekdayTitle } from '@/shared/lib/time/formatWeekday';
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
import { useSurface } from '@/shared/lib/surface';
import normsImg from '@/shared/assets/decarative/norms.png';
import { NutrientsSummaryButton } from '@/shared/ui/AppBottomBar';
import { drawerStore } from '@/shared/ui/drawer-store';
import { NutrientsDrawer } from '@/widgets/nutrients/NutrientsDrawer';

const SCREENS: ScreenEntry[] = [
  { label: 'Лаборатория', image: '/art/experiment.png', titleStyle: 'display-sans' },
  { label: 'Дневной рацион', image: '/art/schedule-food.png', titleStyle: 'display-sans' },
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
const SWIPE_DURATION = 0;

const Page = ({ date }: { date: string }) => {
  // HomePage — warm surface (стрипфорки FoodActionCard / SearchFood input).
  // Лавандовый дефолт стоит на body в App.tsx; здесь перекрываем на warm.
  useSurface('warm');

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

  const { anchor: ambientAnchor } = useDesignVariant('HomeAmbient', HOME_AMBIENT_VARIANTS);

  // Nutrients pill переехал с bottom-bar (leadingSlot) в HomeTopBar centerSlot
  // (эксперимент 2026-05-21: bottom-bar теперь messenger-style write-field, в
  // нём не остаётся места под 2-строчный nutrient-summary). Колбэк живёт здесь,
  // FoodSchedule больше не владеет drawer'ом нутриентов.
  const openNutrients = useCallback(() => {
    void drawerStore.show(
      NutrientsDrawer,
      {
        totals: scheduleTotals,
        missingNutrientNames,
        isLoading: nutrientsLoading,
      },
      { side: 'left', width: 'min(85vw, 360px)' }
    );
  }, [scheduleTotals, missingNutrientNames, nutrientsLoading]);

  const topBarCenterSlot = useMemo(
    () => <NutrientsSummaryButton totals={scheduleTotals} onClick={openNutrients} />,
    [scheduleTotals, openNutrients]
  );

  // Свайп НЕ прокидывается в React-стейт намеренно: каждый слайд рендерит
  // свой статичный ScreenIndicator (slideIndex={0/1/2}), поэтому Page не
  // зависит от активного индекса. Без onIndexChange/activeIndex свайп не
  // вызывает ре-рендер Page и memo'нутых слайдов — Embla двигает DOM сам.
  const handleSelect = useCallback((idx: number) => {
    swipeableRef.current?.goToPage(idx);
  }, []);

  const weekdayTitle = useMemo(() => formatWeekdayTitle(date), [date]);

  // ScreenIndicator передаётся в каждый слайд как `topSlot`. slideIndex={0/1/2}
  // → каждый инстанс статично показывает СВОЙ экран (label, image, highlight'-
  // нутый тайл). Зависимости useMemo — stable handleSelect + weekdayTitle
  // (меняется только при смене даты, не на свайпе) → memo на слайд-виджетах
  // держит, свайп = ноль React-ре-рендеров (Embla двигает DOM сам).
  const labIndicator = useMemo(
    () => (
      <ScreenIndicator
        screens={SCREENS}
        onSelect={handleSelect}
        slideIndex={0}
        // title={weekdayTitle}
      />
    ),
    [handleSelect, weekdayTitle]
  );
  const foodIndicator = useMemo(
    () => (
      <ScreenIndicator
        screens={SCREENS}
        onSelect={handleSelect}
        slideIndex={1}
        // title={weekdayTitle}
      />
    ),
    [handleSelect, weekdayTitle]
  );
  const eventsIndicator = useMemo(
    () => (
      <ScreenIndicator
        screens={SCREENS}
        onSelect={handleSelect}
        slideIndex={2}
        // title={weekdayTitle}
      />
    ),
    [handleSelect, weekdayTitle]
  );

  return (
    <div className={homeStyles.container} {...ambientAnchor}>
      <HomeTopBar date={date} centerSlot={topBarCenterSlot} />
      <div className={homeStyles.swipeArea}>
        <Swipeable
          ref={swipeableRef}
          defaultSlide={DEFAULT_SLIDE}
          duration={SWIPE_DURATION}
          hasDots={false}
        >
          <Laboratory key={date} date={date} topSlot={labIndicator} />
          <FoodSchedule key={date} date={date} items={items} topSlot={foodIndicator} />
          <ScheduleEvents key={date} date={date} events={events} topSlot={eventsIndicator} />
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
