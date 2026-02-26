import { useParams } from 'react-router-dom';
import { domainStore } from '@/store/store';
import { RouterLinks } from '@/router';
import { ScheduleFood } from '@/components/features/builders/ScheduleBuilder/components/schedule-food-actions/ScheduleFood';

const ScheduleFoodPage = () => {
  const { id, childId } = useParams<{ id: string; childId: string }>();

  // Validate params - redirect if missing
  if (!id || !childId) {
    window.location.href = RouterLinks.Schedule;
    return null;
  }

  const child = domainStore.scheduleStore.getScheduleChildById(id, childId, 'food');

  return (
    <ScheduleFood
      foodStore={domainStore.foodStore}
      dishStore={domainStore.dishStore}
      scheduleStore={domainStore.scheduleStore}
      scheduleChildItem={child}
      parentScheduleId={id}
    />
  );
};

export default ScheduleFoodPage;
