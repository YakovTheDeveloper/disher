import { RouterLinks } from '@/router';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SwipeableV2 from '@/components/features/builders/shared/ui/layout/Swipeable/SwipeableV2';
import { FoodSchedule } from '@/components/widgets/FoodSchedule';
import { BuilderScheduleEvents } from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder';
import { FoodsNutrients } from '@/components/widgets/nutrients/FoodsNutrients';
import { useScheduleFoods } from '@/entities/schedule-food';
import { useScheduleEvents } from '@/entities/schedule-event';

const Page = ({ date }: { date: string }) => {
  console.log('schedule builder page render');

  const { results: scheduleFoods } = useScheduleFoods(date);
  const { results: scheduleEvents } = useScheduleEvents(date);
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
        {/* TODO: compute totals from scheduleFoods using calculateProductNutrients/sumNutrients */}
        <FoodsNutrients totals={{}} />
        <FoodSchedule date={date} items={items as any[]} />
        <BuilderScheduleEvents date={date} events={events} />
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
