import { RouterLinks } from '@/app/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Swipeable, type SwipeableRef } from '@/shared/ui/Swipeable';
import homeStyles from './HomePage.module.scss';
import { FoodSchedule } from '@/widgets/FoodSchedule';
import { ScheduleEvents } from '@/widgets/ScheduleEvents';
import { Laboratory } from '@/widgets/Laboratory';
import { NutrientsSummaryBar } from '@/widgets/nutrients/NutrientsSummaryBar';
import { useScheduleFoods, useScheduleNutrientTotals } from '@/entities/schedule-food';
import { useScheduleEvents } from '@/entities/schedule-event';
import type { ScheduleEvent } from '@/entities/schedule-event';
import { HomeScreenIndicator, runTileMigration, type ScreenEntry } from './ui';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import { HOME_BOTTOM_BAR_VARIANTS } from '@/widgets/FoodSchedule/ui';
import normsImg from '@/shared/assets/decarative/norms.png';
import watchImg from '@/shared/assets/decarative/watch.png';
import tree2Img from '@/shared/assets/decarative/tree2.png';

const SCREENS: ScreenEntry[] = [
  { label: 'Лаборатория', image: tree2Img, titleStyle: 'display-sans' },
  { label: 'Приемы пищи', image: watchImg, titleStyle: 'display-sans' },
  { label: 'События', image: normsImg, titleStyle: 'display-sans' },
];

const DEFAULT_SLIDE = 1;
const SWIPE_DURATION = 25;

const Page = ({ date }: { date: string }) => {
  const scheduleFoods = useScheduleFoods(date);
  const scheduleEvents = useScheduleEvents(date);
  const {
    totals: scheduleTotals,
    missingNutrientNames,
    isLoading: nutrientsLoading,
  } = useScheduleNutrientTotals(date);

  const items = scheduleFoods;
  const events = [...scheduleEvents] as ScheduleEvent[];

  const [activeIndex, setActiveIndex] = useState(DEFAULT_SLIDE);
  const swipeableRef = useRef<SwipeableRef>(null);

  // Single source of truth for the bottom-bar design variant across all
  // three home slides (Laboratory / FoodSchedule / ScheduleEvents) so the
  // pill chrome stays consistent as the user swipes between them.
  const { variant: bottomBarVariant } = useDesignVariant(
    'HomeBottomBar',
    HOME_BOTTOM_BAR_VARIANTS,
  );
  const bottomBarVariantIndex = HOME_BOTTOM_BAR_VARIANTS.indexOf(bottomBarVariant);

  const handleIndexChange = useCallback((idx: number) => {
    setActiveIndex(idx);
  }, []);

  // Raw commit — передаётся в `HomeScreenIndicator.onSelect`, который
  // сам оборачивает вызов в `runTileMigration` через свой `handleSelect`.
  // Двойную VT-обёртку отсюда поэтому не делаем.
  const handleSelect = useCallback((idx: number) => {
    swipeableRef.current?.goToPage(idx);
    setActiveIndex(idx);
  }, []);

  // Для невидимого click-layer'а (он лежит ПОВЕРХ Swipeable и перехватывает
  // клики до visible-плитки) — VT/FLIP надо запустить вручную: иначе
  // активная плитка меняется без анимации морфа title ↔ band.
  const handleSelectAnimated = useCallback(
    (idx: number) => {
      runTileMigration(activeIndex, idx, () => handleSelect(idx));
    },
    [activeIndex, handleSelect],
  );

  return (
    <div className={homeStyles.container}>
      <NutrientsSummaryBar
        date={date}
        totals={scheduleTotals}
        missingNutrientNames={missingNutrientNames}
        isLoading={nutrientsLoading}
      />
      <div className={homeStyles.swipeArea}>
        <div className={homeStyles.indicatorFloat}>
          <HomeScreenIndicator
            screens={SCREENS}
            activeIndex={activeIndex}
            onSelect={handleSelect}
          />
        </div>
        <div className={homeStyles.swipeableLayer}>
          <Swipeable
            ref={swipeableRef}
            defaultSlide={DEFAULT_SLIDE}
            duration={SWIPE_DURATION}
            key={date}
            hasDots={false}
            onIndexChange={handleIndexChange}
          >
            <Laboratory
              key={date}
              date={date}
              bottomBarVariantIndex={bottomBarVariantIndex}
            />
            <FoodSchedule
              key={date}
              date={date}
              items={items}
              bottomBarVariantIndex={bottomBarVariantIndex}
            />
            <ScheduleEvents
              key={date}
              date={date}
              events={events}
              bottomBarVariantIndex={bottomBarVariantIndex}
            />
          </Swipeable>
        </div>
        <div className={homeStyles.indicatorClickLayer} aria-hidden>
          {SCREENS.map((screen, i) => (
            <button
              key={screen.label}
              type="button"
              tabIndex={-1}
              aria-label={screen.label}
              className={homeStyles.indicatorClickTile}
              onClick={() => handleSelectAnimated(i)}
            />
          ))}
        </div>
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
