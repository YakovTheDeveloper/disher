import { observer } from 'mobx-react-lite';
import styles from './ScheduleFoodAdd.module.scss';
import { SearchFood } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd';
import { Instance, SnapshotIn } from 'mobx-state-tree';
import { DaySchedule, ScheduleItem } from '@/domain/schedule/schedule';
import { FoodNutrients } from '@/components/features/builders/food/shared/components/FoodNutrients';
import { useSearchParams } from 'react-router';
import { DishNutrients } from '@/components/features/builders/food/ScheduleBuilder/components/DishNutrients';
import { useState, useCallback, useMemo } from 'react'; // Import useCallback
import { TimePicker } from '@/components/features/builders/food/ScheduleBuilder/components/TimePicker';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { ContentEdit } from '@/components/features/builders/food/shared/ContentEdit';
import { useDailyScheduleModals } from '@/components/features/builders/food/ScheduleBuilder/modalContext';
import { Tabs } from '@/components/ui/Tabs';
import clsx from 'clsx';
import { mstEnv } from '@/store/store';
import { DrawerLayout } from '@/components/features/builders/food/shared/components/DrawerLayout';

type TabValue = 'info' | 'foodSelect' | 'quantity' | 'time';

type Props = {
  children?: React.ReactNode;
  schedule: Instance<typeof DaySchedule>;
};

type Tab = {
  value: TabValue;
  label: string;
};

const tabs: Tab[] = [
  { value: 'time', label: 'время' },
  { value: 'foodSelect', label: 'еда' },
  { value: 'quantity', label: 'количество' },
];

enum Steps {
  TimeSelect,
  FoodSelect,
  QuantitySelect,
}

const availableTabsPerStep: Record<Steps, TabValue[]> = {
  [Steps.TimeSelect]: ['time'],
  [Steps.FoodSelect]: ['time', 'foodSelect'],
  [Steps.QuantitySelect]: ['time', 'foodSelect', 'quantity'],
};

const getTabsForStep = (step: Steps): Tab[] => {
  const allowed = availableTabsPerStep[step];
  return tabs.filter((tab) => allowed.includes(tab.value));
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

  const [step, setStep] = useState(Steps.TimeSelect);
  const [tab, setTab] = useState<TabValue>('time');

  const onTimeSetFinish = () => {
    setStep(Steps.FoodSelect);
    setTab('foodSelect');
  };
  const onFoodSetFinish = () => {
    setStep(Steps.QuantitySelect);
    setTab('quantity');
  };
  const onQuantitySetFinish = () => {};

  const onFinish = () => {
    console.log('currentChild', currentChild);
    schedule.addDraftToFoods(currentChild);
    modals.close();
  };

  const isFinishButtonActive = step === Steps.QuantitySelect;

  return (
    <DrawerLayout
      label={<ScreenLabel className={styles.title}>Добавить пищу</ScreenLabel>}
      tabs={<Tabs tabs={getTabsForStep(step)} current={tab} setTab={setTab} />}
      bottom={
        <button
          disabled={!isFinishButtonActive}
          className={clsx([
            styles.finishButton,
            isFinishButtonActive && styles.finishButton_active,
          ])}
          onClick={onFinish}
        >
          Завершить
        </button>
      }
    >
      {tab === 'time' && <ContentEdit.Time item={currentChild} onFinish={onTimeSetFinish} />}
      {tab === 'foodSelect' && (
        <SearchFood scheduleChild={currentChild} onFinish={onFoodSetFinish} />
      )}
      {tab === 'quantity' && (
        <ContentEdit.Quantity item={currentChild} onFinish={onQuantitySetFinish} />
      )}
    </DrawerLayout>
  );
});

export default ScheduleFoodAdd;
