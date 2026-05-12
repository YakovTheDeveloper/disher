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
import { HomeScreenIndicator, type ScreenEntry } from './ui';
import normsImg from '@/shared/assets/decarative/norms.png';
import watchImg from '@/shared/assets/decarative/watch.png';
import tree2Img from '@/shared/assets/decarative/tree2.png';

const SCREENS: ScreenEntry[] = [
  { label: 'Лаборатория', image: tree2Img, titleStyle: 'display-sans' },
  { label: 'Приемы пищи', image: watchImg, titleStyle: 'display-sans' },
  { label: 'События', image: normsImg, titleStyle: 'display-sans' },
];

const DEFAULT_SLIDE = 1;

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

  const handleIndexChange = useCallback((idx: number) => {
    setActiveIndex(idx);
  }, []);

  const handleSelect = useCallback((idx: number) => {
    swipeableRef.current?.goToPage(idx);
    setActiveIndex(idx);
  }, []);

  const indicator = (
    <HomeScreenIndicator screens={SCREENS} activeIndex={activeIndex} onSelect={handleSelect} />
  );

  return (
    <div className={homeStyles.container}>
      <NutrientsSummaryBar
        date={date}
        totals={scheduleTotals}
        missingNutrientNames={missingNutrientNames}
        isLoading={nutrientsLoading}
      />
      <Swipeable
        ref={swipeableRef}
        defaultSlide={DEFAULT_SLIDE}
        key={date}
        hasDots={false}
        onIndexChange={handleIndexChange}
      >
        <Laboratory key={date} date={date} indicator={indicator} />
        <FoodSchedule key={date} date={date} items={items} indicator={indicator} />
        <ScheduleEvents key={date} date={date} events={events} indicator={indicator} />
      </Swipeable>
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
