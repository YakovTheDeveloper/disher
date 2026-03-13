import { useParams } from 'react-router-dom';
import { domainStore } from '@/store/store';
import { RouterLinks } from '@/router';
import { ScheduleFood } from '@/components/features/builders/ScheduleBuilder/components/schedule-food-actions/ScheduleFood';

const ScheduleFoodPage = () => {
  const { id, childId } = useParams<{ id: string; childId: string }>();

  if (!id || !childId) {
    window.location.href = RouterLinks.ScheduleDateSelection;
    return null;
  }

  const child = domainStore.foodScheduleStore.getScheduleChildById(id, childId);

  return (
    <ScheduleFood
      foodStore={domainStore.foodStore}
      dishStore={domainStore.dishStore}
      scheduleStore={domainStore.foodScheduleStore}
      scheduleChildItem={child}
      parentScheduleId={id}
    />
  );
};

export default ScheduleFoodPage;
