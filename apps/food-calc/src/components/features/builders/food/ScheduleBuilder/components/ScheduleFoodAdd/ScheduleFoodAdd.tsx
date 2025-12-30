import { observer } from 'mobx-react-lite';
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
import { mstEnv } from '@/store/store';
import { DrawerLayout } from '@/components/features/builders/food/shared/components/DrawerLayout';
import { useItemCreationSteps } from '@/components/features/builders/food/shared/hooks/useItemCreationSteps';
import { FinishButton } from '@/components/features/builders/food/shared/atoms/FinishButton';

type TabValue = 'info' | 'foodSelect' | 'quantity' | 'time';

type Props = {
  children?: React.ReactNode;
  schedule: Instance<typeof DaySchedule>;
};

const ScheduleFoodAdd = observer(({ schedule }: Props) => {
  const modals = useDailyScheduleModals();

  // const currentChild = schedule.draft.food;
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

  const tabs = [
    { value: 'time', label: 'время', alternativeLabel: currentChild.time },
    { value: 'foodSelect', label: 'еда', alternativeLabel: currentChild.content.name },
    { value: 'quantity', label: 'количество', alternativeLabel: currentChild.quantity },
  ];

  const { currentStep, visibleSteps, setStepByValue, maxStepReached, onStepFinish } =
    useItemCreationSteps(tabs, onFinish);

  return (
    <DrawerLayout
      label={<ScreenLabel className={styles.title}>Добавить пищу</ScreenLabel>}
      tabs={
        <Tabs
          tabs={visibleSteps}
          current={currentStep}
          setTab={setStepByValue}
          variant="scheduleFoodAdd"
        />
      }
      bottom={<FinishButton maxStepReached={maxStepReached} onClick={onFinish} />}
    >
      {currentStep === 'time' && <ContentEdit.Time item={currentChild} onFinish={onStepFinish} />}
      {currentStep === 'foodSelect' && (
        <SearchFood scheduleChild={currentChild} onFinish={onStepFinish} />
      )}
      {currentStep === 'quantity' && (
        <ContentEdit.Quantity item={currentChild} onFinish={onStepFinish} />
      )}
    </DrawerLayout>
  );
});

export default ScheduleFoodAdd;
