import { observer } from 'mobx-react-lite';
import styles from './ScheduleFoodEdit.module.scss';
import { SearchFood } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd';
import { Instance } from 'mobx-state-tree';
import { DaySchedule } from '@/domain/schedule/schedule';
import { FoodNutrients } from '@/components/features/builders/food/shared/components/FoodNutrients';
import { useSearchParams } from 'react-router';
import { DishNutrients } from '@/components/features/builders/food/ScheduleBuilder/components/DishNutrients';
import { useState } from 'react';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { ContentEdit } from '@/components/features/builders/food/shared/ContentEdit';
import { useDailyScheduleModals } from '@/components/features/builders/food/ScheduleBuilder/modalContext';
import { Tabs } from '@/components/ui/Tabs';
import { DrawerLayout } from '@/components/features/builders/food/shared/components/DrawerLayout';

type Props = {
  children?: React.ReactNode;
  schedule: Instance<typeof DaySchedule>;
  defaultTab?: string;
};

const tabs = [
  { value: 'info', label: 'info' },
  { value: 'time', label: 'время' },
  { value: 'foodChange', label: 'еда' },
  { value: 'quantity', label: 'количество' },
];

const ScheduleFoodEdit = observer(({ schedule, defaultTab }: Props) => {
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get('item_id');

  const modals = useDailyScheduleModals();

  const [tab, setTab] = useState<string>(defaultTab || 'foodChange');

  const currentChild = schedule.getChildById(itemId);

  if (!currentChild) return null;

  const variant = currentChild.content.variant;
  const foodId = currentChild.content.foodId;
  const dish = currentChild.content.dish;

  const onFinish = () => modals.close();

  return (
    <DrawerLayout
      label={<ScreenLabel className={styles.title}>Редактирование приема пищи</ScreenLabel>}
      tabs={<Tabs tabs={tabs} current={tab} setTab={setTab} variant="scheduleFoodEdit" />}
    >
      {tab === 'info' && (
        <div>
          {variant === 'dish' && dish && (
            <DishNutrients schedule={schedule} currentDish={dish} currentChild={currentChild} />
          )}
          {variant === 'food' && foodId && <FoodNutrients foodId={foodId} />}
        </div>
      )}
      {tab === 'time' && <ContentEdit.Time item={currentChild} onFinish={onFinish} />}
      {tab === 'foodChange' && <SearchFood scheduleChild={currentChild} onFinish={onFinish} />}
      {tab === 'quantity' && <ContentEdit.Quantity item={currentChild} onFinish={onFinish} />}
    </DrawerLayout>
  );
});

export default ScheduleFoodEdit;
