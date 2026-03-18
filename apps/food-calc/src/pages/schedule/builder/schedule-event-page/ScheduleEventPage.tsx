import { useParams } from 'react-router-dom';
import { RouterLinks } from '@/router';
import { ScheduleEventsAdd } from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder/components/modal/ScheduleEventsAdd';
import { useScheduleEvents } from '@/entities/schedule-event';

const ScheduleEventPage = () => {
  const { id, childId } = useParams<{ id: string; childId: string }>();

  // Validate params - redirect if missing
  if (!id || !childId) {
    window.location.href = RouterLinks.ScheduleDateSelection;
    return null;
  }

  const { results: scheduleEvents } = useScheduleEvents(id);
  const child = scheduleEvents?.find((item) => item.id === childId) ?? null;

  return (
    <ScheduleEventsAdd
      foodStore={null}
      dishStore={null}
      scheduleStore={null}
      scheduleChildItem={child}
      parentScheduleId={id}
    />
  );
};

export default ScheduleEventPage;
