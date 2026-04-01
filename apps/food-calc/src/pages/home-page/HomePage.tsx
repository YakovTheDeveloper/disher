import { RouterLinks } from '@/app/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Swipeable, type SwipeableRef } from '@/shared/ui/Swipeable';
import homeStyles from './HomePage.module.scss';
import { FoodSchedule } from '@/widgets/FoodSchedule';
import { ScheduleEvents } from '@/widgets/ScheduleEvents';
import { FoodsNutrients } from '@/widgets/nutrients/FoodsNutrients';
import { useScheduleFoods, useScheduleNutrientTotals } from '@/entities/schedule-food';
import { useScheduleEvents } from '@/entities/schedule-event';
import type { ScheduleEvent } from '@/entities/schedule-event';

const Page = ({ date }: { date: string }) => {
  console.log('schedule builder page render');

  const scheduleFoods = useScheduleFoods(date);
  const scheduleEvents = useScheduleEvents(date);
  const {
    totals: scheduleTotals,
    missingNutrientNames,
    isLoading: nutrientsLoading,
  } = useScheduleNutrientTotals(date);

  const items = scheduleFoods;
  const events = [...scheduleEvents] as ScheduleEvent[];

  const swipeableRef = useRef<SwipeableRef>(null);
  const [richNutrient, setRichNutrient] = useState<{ id: string; unit: string } | null>(null);
  const [activeSlide, setActiveSlide] = useState(1);

  const handleRichFood = useCallback((nutrientId: string, unit: string) => {
    setRichNutrient({ id: nutrientId, unit });
    // Swipe to FoodSchedule slide (index 1)
    swipeableRef.current?.goToPage(1);
  }, []);

  const handleRichNutrientClear = useCallback(() => {
    setRichNutrient(null);
  }, []);

  const onPageChange = (page: number, _total: number) => {
    setActiveSlide(page);
  };

  return (
    <>
      <Swipeable ref={swipeableRef} defaultSlide={1} onIndexChange={onPageChange} key={date} hasDots>
        <FoodsNutrients
          key={date}
          totals={scheduleTotals}
          missingNutrientNames={missingNutrientNames}
          isLoading={nutrientsLoading}
          className={homeStyles.nutrientsSlide}
          onRichFood={handleRichFood}
        />
        <FoodSchedule key={date} date={date} items={items} richNutrient={richNutrient} onRichNutrientClear={handleRichNutrientClear} isActive={activeSlide === 1} />
        <ScheduleEvents key={date} date={date} events={events} />
      </Swipeable>
    </>
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
