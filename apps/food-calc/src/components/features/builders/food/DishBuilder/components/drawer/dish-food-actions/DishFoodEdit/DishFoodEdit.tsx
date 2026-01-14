import { observer } from 'mobx-react-lite';
import styles from './ScheduleFoodEdit.module.scss';
import { SearchFood } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd';
import { FoodNutrients } from '@/components/features/builders/food/shared/components/FoodNutrients';
import { DishNutrients } from '@/components/features/builders/food/ScheduleBuilder/components/DishNutrients';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { ContentEdit } from '@/components/features/builders/food/shared/ContentEdit';
import { Tabs } from '@/components/ui/Tabs';
import { DrawerLayout } from '@/components/features/builders/food/shared/components/DrawerLayout';
import { useScheduleFoodActions } from '@/components/features/builders/food/ScheduleBuilder/components/schedule-food-actions/hooks/useScheduleFoodActions';
import { useTabs } from '@/components/features/builders/food/shared/hooks/useTabs';
import { SearchFoodControls } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd/SearchFoodControls';
import { Spacer } from '@/components/ui/atoms/Spacer';
import {
  useSchedule,
  useSelectedScheduleItem,
} from '@/components/features/builders/food/ScheduleBuilder/context';
import {
  useDish,
  useSelectedDishItem,
} from '@/components/features/builders/food/DishBuilder/context';

type Props = {
  defaultTab?: string;
  close: () => void;
};

const tabs = [
  { value: 'info', label: 'info' },
  { value: 'foodChange', label: 'еда' },
  { value: 'quantity', label: 'количество' },
];

const DishFoodEdit = observer(({ defaultTab, close }: Props) => {
  const currentChild = useSelectedDishItem();
  const { currentTab, setTab } = useTabs(tabs, defaultTab);
  const { searchState } = useScheduleFoodActions(currentChild);

  const foodId = currentChild.content.foodId;

  const onFinish = () => close();

  return (
    <DrawerLayout
      label={
        <ScreenLabel className={styles.title} variant="drawer">
          Поменять
        </ScreenLabel>
      }
      tabs={<Tabs tabs={tabs} current={currentTab} setTab={setTab} variant="scheduleFoodEdit" />}
      subHeader={
        currentTab === 'foodChange' && (
          <SearchFoodControls searchState={searchState} isVisible={true} />
        )
      }
    >
      {currentTab === 'info' && foodId && <FoodNutrients foodId={foodId} />}
      {currentTab === 'foodChange' && (
        <SearchFood scheduleChild={currentChild} onFinish={onFinish} searchState={searchState} />
      )}
      {currentTab === 'quantity' && (
        <ContentEdit.Quantity item={currentChild} onFinish={onFinish} />
      )}
      <Spacer variant="drawer-footer-offset" />
    </DrawerLayout>
  );
});

export default DishFoodEdit;
