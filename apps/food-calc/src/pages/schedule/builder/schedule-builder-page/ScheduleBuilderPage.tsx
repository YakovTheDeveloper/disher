import { RouterLinks } from '@/router';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { domainStore } from '@/store/store';
import { DaySchedule } from '@/domain/schedule/schedule.model';
import { Instance } from 'mobx-state-tree';
import SwipeableV2 from '@/components/features/builders/shared/ui/layout/Swipeable/SwipeableV2';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { FoodSchedule } from '@/components/widgets/FoodSchedule';
import { BuilderScheduleEvents } from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder';
import { TotalNutrients } from '@/components/features/builders/TotalNutrients/TotalNutrients';
import { FilterButton } from '@/components/ui/atoms/Button';
import { ScheduleFoodsNutrients } from '@/components/widgets/nutrients/ScheduleFoodsNutrients';

const Page = observer(({ date }: { date: string }) => {
  console.log('schedule builder page render');

  const foodSchedule =
    domainStore.foodScheduleStore.data.get(date) ||
    domainStore.foodScheduleStore.addLocal({ id: date });

  const eventSchedule =
    domainStore.eventScheduleStore.data.get(date) ||
    domainStore.eventScheduleStore.addLocal({ id: date });

  const onPageChange = (page: number, total: number) => {
    if (page === 2) {
      document.body.style.backgroundColor = '#e6e6e6';
    } else {
      document.body.style.backgroundColor = '';
    }
  };

  return (
    <>
      <SwipeableV2 defaultSlide={1} onIndexChange={onPageChange}>
        <ScheduleFoodsNutrients schedule={foodSchedule} />

        <FoodSchedule schedule={foodSchedule} />
        <BuilderScheduleEvents schedule={eventSchedule} />
      </SwipeableV2>
    </>
  );
});

const GetDatePageWrapper = () => {
  const params = useParams();
  const date = params.id;
  const navigate = useNavigate();

  useEffect(() => {
    if (!date) {
      navigate(RouterLinks.Schedule);
    }
  }, [date]);

  if (!date) return null;

  return <Page date={date} />;
};

export default GetDatePageWrapper;
