import { RouterLinks } from '@/router';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SwipeableV2 from '@/components/features/builders/shared/ui/layout/Swipeable/SwipeableV2';
import { FoodSchedule } from '@/components/widgets/FoodSchedule';
import { ScheduleEvents } from '@/components/widgets/ScheduleEvents';
import { FoodsNutrients } from '@/components/widgets/nutrients/FoodsNutrients';
import { useScheduleFoods, useScheduleNutrientTotals } from '@/entities/schedule-food';
import { useScheduleEvents } from '@/entities/schedule-event';

const Page = ({ date }: { date: string }) => {
  console.log('schedule builder page render');

  const { results: scheduleFoods } = useScheduleFoods(date);
  const { results: scheduleEvents } = useScheduleEvents(date);
  const scheduleTotals = useScheduleNutrientTotals(date);
  const items = scheduleFoods ?? [];
  const events = scheduleEvents ?? [];

  const onPageChange = (page: number, _total: number) => {
    if (page === 2) {
      document.body.style.backgroundColor = '#e6e6e6';
    } else {
      document.body.style.backgroundColor = '';
    }
  };

  return (
    <>
      <SwipeableV2 defaultSlide={1} onIndexChange={onPageChange}>
        <FoodsNutrients totals={scheduleTotals} />
        <FoodSchedule date={date} items={items as any[]} />
        <ScheduleEvents date={date} events={events} />
      </SwipeableV2>
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
    }
  }, [date]);

  if (!date) return null;

  return <Page date={date} />;
};

export default GetDatePageWrapper;
