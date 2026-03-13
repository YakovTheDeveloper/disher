import { useParams } from 'react-router-dom';
import { domainStore } from '@/store/store';
import { RouterLinks } from '@/router';
import { ScheduleFood } from '@/components/features/builders/ScheduleBuilder/components/schedule-food-actions/ScheduleFood';
import { ScheduleEventsAdd } from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder/components/modal/ScheduleEventsAdd';

const ScheduleEventPage = () => {
  const { id, childId } = useParams<{ id: string; childId: string }>();

  // Validate params - redirect if missing
  if (!id || !childId) {
    window.location.href = RouterLinks.ScheduleDateSelection;
    return null;
  }

  const child = domainStore.eventScheduleStore.getScheduleChildById(id, childId);

  console.log('omg', child);

  return (
    <ScheduleEventsAdd
      foodStore={domainStore.foodStore}
      dishStore={domainStore.dishStore}
      scheduleStore={domainStore.eventScheduleStore}
      scheduleChildItem={child}
      parentScheduleId={id}
    />
  );
};

export default ScheduleEventPage;
