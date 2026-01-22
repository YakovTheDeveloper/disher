import { observer } from 'mobx-react-lite';
import styles from './ScheduleFoodEdit.module.scss';
import { SearchFood } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd';
import { FoodNutrients } from '@/components/features/builders/food/shared/components/FoodNutrients';
import { DishNutrients } from '@/components/features/builders/food/ScheduleBuilder/components/DishNutrients';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { ContentEdit } from '@/components/features/builders/food/shared/ContentEdit';
import { Tabs } from '@/components/ui/Tabs';
import { DrawerLayout } from '@/components/features/builders/food/shared/components/DrawerLayout';
import { useTabs } from '@/components/features/builders/food/shared/hooks/useTabs';
import { SearchFoodControls } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd/SearchFoodControls';
import { Spacer } from '@/components/ui/atoms/Spacer';
import {
  useSchedule,
  useSelectedScheduleItem,
} from '@/components/features/builders/food/ScheduleBuilder/context';
import { useFilteringState } from '@/components/features/shared/hooks/useFilteringState';
import { foodSearchConfing } from '@/components/features/builders/food/ScheduleBuilder/components/schedule-food-actions/config/config';
import SwipeableV2 from '@/components/features/builders/food/shared/ui/layout/Swipeable/SwipeableV2';

type Props = {
  defaultTab?: string;
  close: () => void;
};

const tabs = [
  { value: 'info', label: 'info' },
  { value: 'time', label: 'время' },
  { value: 'foodChange', label: 'еда' },
  { value: 'quantity', label: 'количество' },
];

const ScheduleFoodEdit = observer(({ defaultTab, close }: Props) => {
  const schedule = useSchedule();
  const currentChild = useSelectedScheduleItem();
  const { currentTab, setTab } = useTabs(tabs, defaultTab);
  const filterState = useFilteringState(foodSearchConfing);

  const variant = currentChild.content.variant;
  const foodId = currentChild.content.foodId;
  const dish = currentChild.content.dish;

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
          <SearchFoodControls searchState={filterState} isVisible={true} />
        )
      }
    >
      <SwipeableV2 ref={swipeRef} onIndexChange={(index) => originalSetTab(indexToTab[index])}>
        {currentTab === 'info' && (
          <div>
            {variant === 'dish' && dish && (
              <DishNutrients schedule={schedule} currentDish={dish} currentChild={currentChild} />
            )}
            {variant === 'food' && foodId && <FoodNutrients foodId={foodId} />}
          </div>
        )}
        <ContentEdit.Time item={currentChild} onFinish={goNext} />
        <SearchFood
          scheduleChild={currentChild}
          onFinish={onProductChoose}
          searchState={filterState}
        >
          <SearchFoodControls searchState={filterState} isVisible={true} />
        </SearchFood>
        <ContentEdit.Quantity item={currentChild} onFinish={goNext} />
      </SwipeableV2>

      {currentTab === 'time' && <ContentEdit.Time item={currentChild} onFinish={onFinish} />}
      {currentTab === 'foodChange' && (
        <SearchFood scheduleChild={currentChild} onFinish={onFinish} searchState={filterState} />
      )}
      {currentTab === 'quantity' && (
        <ContentEdit.Quantity item={currentChild} onFinish={onFinish} />
      )}
      <Spacer variant="drawer-footer-offset" />
    </DrawerLayout>
  );
});

export default ScheduleFoodEdit;
