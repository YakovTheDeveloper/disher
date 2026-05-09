import { RouterLinks } from '@/app/router';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Swipeable } from '@/shared/ui/Swipeable';
import homeStyles from './HomePage.module.scss';
import { FoodSchedule } from '@/widgets/FoodSchedule';
import { ScheduleEvents } from '@/widgets/ScheduleEvents';
import { Laboratory } from '@/widgets/Laboratory';
import { NutrientsSummaryBar } from '@/widgets/nutrients/NutrientsSummaryBar';
import { useScheduleFoods, useScheduleNutrientTotals } from '@/entities/schedule-food';
import { useScheduleEvents } from '@/entities/schedule-event';
import type { ScheduleEvent } from '@/entities/schedule-event';

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

  return (
    <div className={homeStyles.container}>
      <NutrientsSummaryBar
        totals={scheduleTotals}
        missingNutrientNames={missingNutrientNames}
        isLoading={nutrientsLoading}
      />
      <Swipeable defaultSlide={1} key={date} hasDots>
        <Laboratory key={date} date={date} />
        <FoodSchedule key={date} date={date} items={items} />
        <ScheduleEvents key={date} date={date} events={events} />
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
