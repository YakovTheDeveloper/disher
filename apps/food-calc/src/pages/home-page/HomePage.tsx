import { RouterLinks } from '@/app/router';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Swipeable } from '@/shared/ui/Swipeable';
import homeStyles from './HomePage.module.scss';
import { FoodSchedule } from '@/widgets/FoodSchedule';
import { ScheduleEvents } from '@/widgets/ScheduleEvents';
import { FoodsNutrients } from '@/widgets/nutrients/FoodsNutrients';
import { useScheduleFoods, useScheduleNutrientTotals } from '@/entities/schedule-food';
import { useScheduleEvents } from '@/entities/schedule-event';

const Page = ({ date }: { date: string }) => {
  console.log('schedule builder page render');

  const { results: scheduleFoods } = useScheduleFoods(date);
  const { results: scheduleEvents } = useScheduleEvents(date);
  const {
    totals: scheduleTotals,
    missingNutrientNames,
    isLoading: nutrientsLoading,
  } = useScheduleNutrientTotals(date);

  const items = scheduleFoods ?? [];
  const events = scheduleEvents ?? [];

  const onPageChange = (page: number, _total: number) => {
    // if (page === 2) {
    //   document.body.style.backgroundColor = '#e6e6e6';
    // } else {
    //   document.body.style.backgroundColor = '';
    // }
  };

  return (
    <>
      <Swipeable defaultSlide={1} onIndexChange={onPageChange} key={date}>
        <FoodsNutrients
          key={date}
          totals={scheduleTotals}
          missingNutrientNames={missingNutrientNames}
          isLoading={nutrientsLoading}
          className={homeStyles.nutrientsSlide}
        />
        <FoodSchedule key={date} date={date} items={items} />
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
