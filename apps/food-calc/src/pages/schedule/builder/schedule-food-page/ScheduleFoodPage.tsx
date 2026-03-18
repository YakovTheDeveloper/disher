import { useParams } from 'react-router-dom';
import { RouterLinks } from '@/router';
import { ScheduleFood } from '@/components/features/builders/ScheduleBuilder/components/schedule-food-actions/ScheduleFood';
import { useScheduleFoods } from '@/entities/schedule-food';

const ScheduleFoodPage = () => {
  const { id, childId } = useParams<{ id: string; childId: string }>();

  if (!id || !childId) {
    window.location.href = RouterLinks.ScheduleDateSelection;
    return null;
  }

  const { results: scheduleFoods } = useScheduleFoods(id);
  const child = scheduleFoods?.find((item) => item.id === childId) ?? null;

  return (
    <ScheduleFood
      foodStore={null}
      dishStore={null}
      scheduleStore={null}
      scheduleChildItem={child}
      parentScheduleId={id}
    />
  );
};

export default ScheduleFoodPage;
