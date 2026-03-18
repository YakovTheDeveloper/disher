/**
 * MIGRATED: ScheduleBuilderPage
 *
 * Uses Triplit reactive queries — no MST, no ensureSchedule.
 * scheduleFoods and scheduleEvents are flat collections filtered by date.
 */

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RouterLinks } from '@/router';
import SwipeableV2 from '@/components/features/builders/shared/ui/layout/Swipeable/SwipeableV2';
import { useScheduleFoods } from '@/entities/schedule-food';
import { useScheduleEvents } from '@/entities/schedule-event';
import FoodsNutrients from '@/components/widgets/nutrients/FoodsNutrients/FoodsNutrients';
import FoodSchedule from '@/components/widgets/FoodSchedule/FoodSchedule';
import BuilderScheduleEvents from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder/BuilderScheduleEvents';

function SchedulePage({ date }: { date: string }) {

  // Reactive queries — automatically re-render on data changes (local or remote)
  // No loading gate: Triplit is offline-first, data is available from IndexedDB immediately.
  // The user can interact while sync is in progress — conflicts are merged automatically.
  const { results: items } = useScheduleFoods(date);
  const { results: events } = useScheduleEvents(date);

  const itemsArray = items ?? [];
  const eventsArray = events ?? [];

  const onPageChange = (page: number) => {
    document.body.style.backgroundColor = page === 2 ? '#e6e6e6' : '';
  };

  return (
    <SwipeableV2 defaultSlide={1} onIndexChange={onPageChange}>
      <FoodsNutrients items={itemsArray} />
      <FoodSchedule date={date} items={itemsArray} />
      <BuilderScheduleEvents date={date} events={eventsArray} />
    </SwipeableV2>
  );
}

export default function ScheduleBuilderPage() {
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

  return <SchedulePage date={date} />;
}
