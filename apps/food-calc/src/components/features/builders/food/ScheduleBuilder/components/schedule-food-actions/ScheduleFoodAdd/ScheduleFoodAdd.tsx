import { observer } from 'mobx-react-lite';
import styles from './ScheduleFoodAdd.module.scss';
import { SearchFood } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd';
import { ScheduleItem } from '@/domain/schedule/schedule';
import { useMemo } from 'react'; // Import useCallback
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { ContentEdit } from '@/components/features/builders/food/shared/ContentEdit';
import { Tabs } from '@/components/ui/Tabs';
import { mstEnv } from '@/store/store';
import { DrawerLayout } from '@/components/features/builders/food/shared/components/DrawerLayout';
import { useTabs } from '@/components/features/builders/food/shared/hooks/useTabs';
import { FinishButton } from '@/components/features/builders/food/shared/atoms/FinishButton';
import { SearchFoodControls } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd/SearchFoodControls';
import { useScheduleFoodActions } from '@/components/features/builders/food/ScheduleBuilder/components/schedule-food-actions/hooks/useScheduleFoodActions';
import { Spacer } from '@/components/ui/atoms/Spacer';
import { useSchedule } from '@/components/features/builders/food/ScheduleBuilder/context';
import { createScheduleItemDraft } from '@/domain/schedule/factory';
import { Swipeable } from '@/components/features/builders/food/shared/ui/layout/Swipeable';

type Props = {
  close: () => void;
};

const ScheduleFoodAdd = observer(({ close }: Props) => {
  const schedule = useSchedule();

  const currentChild = useMemo(
    () => createScheduleItemDraft(schedule.lastTimeItemAdded),
    [schedule.lastTimeItemAdded]
  );

  const onFinish = () => {
    schedule.addDraftToFoods(currentChild);
    close();
  };

  const { searchState } = useScheduleFoodActions(currentChild);

  const tabs = [
    { value: 'time', label: 'время', alternativeLabel: currentChild.time },
    { value: 'foodSelect', label: 'еда', alternativeLabel: currentChild.content?.name || '' },
    { value: 'quantity', label: 'количество', alternativeLabel: currentChild.quantity },
  ];

  const { currentTab, goNext, setTab } = useTabs(tabs);

  return (
    <DrawerLayout
      label={<ScreenLabel className={styles.title}>Добавить</ScreenLabel>}
      tabs={
        <>
          <Tabs tabs={tabs} current={currentTab} setTab={setTab} variant="scheduleFoodAdd" />
        </>
      }
      subHeader={
        currentTab === 'foodSelect' && (
          <SearchFoodControls searchState={searchState} isVisible={true} />
        )
      }
      topRight={<FinishButton onClick={onFinish} />}
    >
      <Swipeable pageNames={['a', 'b', 'c']} style={{ minHeight: '25dvh' }}>
        <ContentEdit.Time item={currentChild} onFinish={goNext} />
        <SearchFood scheduleChild={currentChild} onFinish={goNext} searchState={searchState} />
        <ContentEdit.Quantity item={currentChild} onFinish={goNext} />
      </Swipeable>

      {/* {currentTab === 'time' && <ContentEdit.Time item={currentChild} onFinish={goNext} />}
      {currentTab === 'foodSelect' && (
        <SearchFood scheduleChild={currentChild} onFinish={goNext} searchState={searchState} />
      )}
      {currentTab === 'quantity' && <ContentEdit.Quantity item={currentChild} onFinish={goNext} />} */}

      <Spacer variant="drawer-footer-offset" />
    </DrawerLayout>
  );
});

export default ScheduleFoodAdd;
