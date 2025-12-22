import { ScheduleBuilder } from '@/components/blocks/builders/food/ScheduleBuilder';
import { DayScheduleUI } from '@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';
import { Navigation } from '@/components/blocks/builders/food/ScheduleBuilder/ui/Navigation';
import { Menu } from '@/components/common/Menu';
import { Button } from '@/components/ui/Button';
import { RouterLinks } from '@/router';
import { scheduleStore } from '@/store/rootStore';
import { MenuUiStore } from '@/store/uiStore/menu/menuUiStore';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import styles from './ScheduleBuilderPage.module.scss';
import { InitLoadingStore } from '@/components/blocks/builders/food/ScheduleBuilder/model/InitLoadingStore';
import { Overlay, WithOverlay } from '@/components/ui/Overlay';
import { debounce } from '@/utils/debounce';
import { ScheduleQuestionnaireItemUI } from '@/components/blocks/builders/food/ScheduleBuilder/EventsBuilder/viewModel/EventsBuilderViewModel';
import { ModalDailyScheduleProvider } from '@/components/blocks/builders/food/ScheduleBuilder/modalContext';
import { domainStore } from '@/store/store';
import { DaySchedule } from '@/domain/schedule/schedule';
import { Instance } from 'mobx-state-tree';

const Page = observer(({ date }: { date: string }) => {
  const store = useMemo(() => new InitLoadingStore(), []);
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

  const isLoading = useCallback(
    () => domainStore.daySchedule.status.fetchGet.get(date)?.loading ?? false,
    [domainStore.daySchedule.status, date]
  );

  console.log('store.initData', store.initData);
  console.log('schedule builder page render');

  const current = domainStore.daySchedule.data.get(date);

  const init = async () => {
    const { code, data = null } = await domainStore.daySchedule.fetchGetOneByDate(date);

    if (code === 404) {
      domainStore.daySchedule.addLocal({ date, isDraft: true });
    }

    if (data) {
      domainStore.daySchedule.addLocal({ ...data, isDraft: false });
    }
  };

  useEffect(() => {
    console.log('current', current);
    if (current) return;
    init();
  }, [current]);

  useEffect(() => {
    init();
  }, []);

  return (
    <ModalDailyScheduleProvider>
      <div className={styles.container}>
        <Navigation></Navigation>
        <Overlay isLoading={isLoading} className={styles.overlay} />
        {current && (
          <ScheduleBuilder key={date} date={date} schedule={current} onFinish={onFinish} />
        )}
      </div>
    </ModalDailyScheduleProvider>
  );
});

const GetDatePageWrapper = () => {
  const params = useParams();
  const date = params.date;
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
