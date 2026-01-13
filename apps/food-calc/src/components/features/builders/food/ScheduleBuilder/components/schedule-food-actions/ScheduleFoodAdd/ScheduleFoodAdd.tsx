import { observer, useLocalObservable } from 'mobx-react-lite';
import styles from './ScheduleFoodAdd.module.scss';
import { SearchFood } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd';
import { Instance } from 'mobx-state-tree';
import { DaySchedule, ScheduleItem } from '@/domain/schedule/schedule';
import { useMemo } from 'react'; // Import useCallback
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { ContentEdit } from '@/components/features/builders/food/shared/ContentEdit';
import { useDailyScheduleModals } from '@/components/features/builders/food/ScheduleBuilder/modalContext';
import { Tabs } from '@/components/ui/Tabs';
import clsx from 'clsx';
import { mstEnv, domainStore } from '@/store/store';
import { filterBy } from '@/lib/filter/filter';
import { DrawerLayout } from '@/components/features/builders/food/shared/components/DrawerLayout';
import { useTabs } from '@/components/features/builders/food/shared/hooks/useTabs';
import { FinishButton } from '@/components/features/builders/food/shared/atoms/FinishButton';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import { SearchFoodControls } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd/SearchFoodControls';
import { useScheduleFoodActions } from '@/components/features/builders/food/ScheduleBuilder/components/schedule-food-actions/hooks/useScheduleFoodActions';
import { Spacer } from '@/components/ui/atoms/Spacer';

type Props = {
  children?: React.ReactNode;
  schedule: Instance<typeof DaySchedule>;
};

const ScheduleFoodAdd = observer(({ schedule }: Props) => {
  const modals = useDailyScheduleModals();

  const currentChild = useMemo(
    () =>
      ScheduleItem.create(
        {
          id: 'draft-food',
          quantity: 100,
          time: schedule.lastTimeItemAdded || '12:00',
          content: { variant: 'custom', customName: 'Мой продукт' },
        },
        mstEnv
      ),
    []
  );

  const onFinish = () => {
    schedule.addDraftToFoods(currentChild);
    modals.close();
  };

  const { searchState } = useScheduleFoodActions(currentChild);

  const tabs = [
    { value: 'time', label: 'время', alternativeLabel: currentChild.time },
    { value: 'foodSelect', label: 'еда', alternativeLabel: currentChild.content.name },
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
      {currentTab === 'time' && <ContentEdit.Time item={currentChild} onFinish={goNext} />}
      {currentTab === 'foodSelect' && (
        <SearchFood scheduleChild={currentChild} onFinish={goNext} searchState={searchState} />
      )}
      {currentTab === 'quantity' && <ContentEdit.Quantity item={currentChild} onFinish={goNext} />}
      <Spacer variant="drawer-footer-offset" />
    </DrawerLayout>
  );
});

export default ScheduleFoodAdd;
