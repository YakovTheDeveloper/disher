import { useParams } from 'react-router-dom';
import { domainStore } from '@/store/store';
import { RouterLinks } from '@/router';
import { ScheduleFood } from '@/components/features/builders/ScheduleBuilder/components/schedule-food-actions/ScheduleFood';
import { ScheduleEventsAdd } from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder/components/modal/ScheduleEventsAdd';

const ScheduleEventPage = () => {
  const { id, childId } = useParams<{ id: string; childId: string }>();

  // Validate params - redirect if missing
  if (!id || !childId) {
    window.location.href = RouterLinks.Schedule;
    return null;
  }

  const child = domainStore.scheduleStore.getScheduleChildById(id, childId, 'event');

  return (
    <ScheduleEventsAdd
      foodStore={domainStore.foodStore}
      dishStore={domainStore.dishStore}
      scheduleStore={domainStore.scheduleStore}
      scheduleChildItem={child}
      parentScheduleId={id}
    />
  );
};

export default ScheduleEventPage;
