import { ScheduleBuilder } from '@/components/features/builders/ScheduleBuilder';
import { RouterLinks } from '@/router';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { domainStore } from '@/store/store';
import { DaySchedule } from '@/domain/schedule/schedule.model';
import { Instance } from 'mobx-state-tree';

const Page = observer(({ date }: { date: string }) => {
  // const onInit = useMemo(
  //   () =>
  //     debounce((date: string) => {
  //       console.log('on init function');
  //       store.onInit(date);
  //     }, 500),
  //   [store]
  // );

  const onFinish = useCallback(async (payload: Instance<typeof DaySchedule>) => {
    domainStore.interactionsService.fetchSyncScheduleAndDishes(payload);
  }, []);

  // const isLoading = useCallback(
  //   () => domainStore.scheduleStore.status.fetchGet.get(date)?.loading ?? false,
  //   [domainStore.scheduleStore.status, date]
  // );

  console.log('schedule builder page render');

  const current = domainStore.scheduleStore.data.get(date);

  const init = async () => {
    const localSchedule = domainStore.scheduleStore.addLocal({ id: date });
    domainStore.interactionsService.fetchSyncScheduleAndDishes(localSchedule);
  };

  useEffect(() => {
    console.log('current', current);
    if (current) return;
    init();
  }, [current]);

  return (
    <>
      {current ? (
        <ScheduleBuilder key={date} date={date} schedule={current} />
      ) : null}
    </>
  );
});

const GetDatePageWrapper = () => {
  const params = useParams();
  const date = params.id;
  const navigate = useNavigate();

  useEffect(() => {
    if (!date) {
      navigate(RouterLinks.Schedule);
    }
  }, [date]);

  if (!date) return null;

  return <Page date={date} />;
};

export default GetDatePageWrapper;
