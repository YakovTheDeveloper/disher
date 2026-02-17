import ScheduleFoodAddV2 from '@/components/features/builders/ScheduleBuilder/components/schedule-food-actions/ScheduleFoodAddV2';
import { domainStore } from '@/store/store';
import { RouterLinks } from '@/router';
import { useRequiredRouteParam } from '@/hooks/useRequiredRouteParam';

const ScheduleFoodAddV2Page = () => {
  const { paramId: id, isValid } = useRequiredRouteParam({
    navigateToUrlOnFail: RouterLinks.Schedule,
  });

  if (!isValid || !id) return null;

  const child = domainStore.scheduleStore.foodDraft;

  return (
    <ScheduleFoodAddV2
      foodStore={domainStore.foodStore}
      dishStore={domainStore.dishStore}
      scheduleStore={domainStore.scheduleStore}
      scheduleChildItem={child}
      parentScheduleId={id}
    />
  );
};

export default ScheduleFoodAddV2Page;
