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
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './ScheduleBuilderPage.module.scss';
import { InitLoadingStore } from '@/components/blocks/builders/food/ScheduleBuilder/model/InitLoadingStore';
import { Overlay, WithOverlay } from '@/components/ui/Overlay';
import { debounce } from '@/utils/debounce';

const Page = observer(({ date }: { date: string }) => {
  const store = useMemo(() => new InitLoadingStore(), []);

  // trace(true);

  const onInit = useMemo(
    () =>
      debounce((date: string) => {
        console.log('on init function');
        store.onInit(date);
      }, 500),
    [store]
  );

  useEffect(() => {
    store.reset();
    onInit(date);

    return () => {
      onInit.cancel();
    };
  }, [date, onInit]);

  const onFinish = useCallback(async (payload: DayScheduleUI) => {
    if (payload.id === -1) {
      const { data = null } = await scheduleStore.create(payload);
      if (data) store.set(data);
      return;
    }
    const { data = null } = await scheduleStore.update(payload);
    if (data) store.set(data);
    return;
  }, []);

  const isLoading = useCallback(
    () => scheduleStore.requestState.getOneByDate.get(date)?.loading ?? false,
    [scheduleStore, date]
  );

  const getLoadingState = useCallback(
    () => scheduleStore.requestState.createOrUpdate.get(date)?.loading ?? false,
    [scheduleStore, date]
  );

  console.log('store.initData', store.initData);
  console.log('schedule builder page render');

  return (
    <div className={styles.container}>
      <Navigation></Navigation>
      <Overlay isLoading={isLoading} className={styles.overlay} />
      {store.initData && (
        <ScheduleBuilder
          key={date}
          schedule={store.initData}
          onFinish={onFinish}
          getLoadingState={getLoadingState}
        />
      )}
      {/* <WithOverlay isLoading={isLoading}>
        {store.initData && (
          <ScheduleBuilder
            key={date}
            schedule={store.initData}
            onFinish={onFinish}
            getLoadingState={getLoadingState}
          />
        )}
      </WithOverlay> */}
    </div>
  );
});

const GetDatePageWrapper = () => {
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date');
  const navigate = useNavigate();

  if (!date) {
    navigate(RouterLinks.Schedule);
    return null;
  }

  return <Page date={date} />;
};

export default GetDatePageWrapper;
