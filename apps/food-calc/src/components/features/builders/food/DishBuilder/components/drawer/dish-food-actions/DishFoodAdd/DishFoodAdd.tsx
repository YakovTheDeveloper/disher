import { observer } from 'mobx-react-lite';
import styles from './DishFoodAdd.module.scss';
import { useDish } from '@/components/features/builders/food/DishBuilder/context';
import { useMemo } from 'react';
import { DishItem } from '@/domain/dish/Dish';
import { useDishFoodActions } from '@/components/features/builders/food/DishBuilder/components/drawer/dish-food-actions/hooks/useDishFoodActions';
import { useTabs } from '@/components/features/builders/food/shared/hooks/useTabs';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { DrawerLayout } from '@/components/features/builders/food/shared/components/DrawerLayout';
import { Tabs } from '@/components/ui/Tabs';
import { SearchFoodControls } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd/SearchFoodControls';
import { FinishButton } from '@/components/features/builders/food/shared/atoms/FinishButton';
import { ContentEdit } from '@/components/features/builders/food/shared/ContentEdit';
import { Spacer } from '@/components/ui/atoms/Spacer';
import { SearchFood } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd';
import { mstEnv } from '@/store/store';
type Props = {
  close: () => void;
};

const DishFoodAdd = ({ close }: Props) => {
  const dish = useDish();

  const currentChild = useMemo(
    () =>
      DishItem.create(
        {
          id: 'draft-food',
          quantity: 100,
          description: '',
          descriptionEng: '',
          content: { variant: 'custom', customName: 'Мой продукт' },
        },
        mstEnv
      ),
    []
  );

  const onFinish = () => {
    dish.addChildFromDraft(currentChild);
    close();
  };

  const { searchState } = useDishFoodActions(currentChild);

  const tabs = [
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
      {currentTab === 'foodSelect' && (
        <SearchFood scheduleChild={currentChild} onFinish={goNext} searchState={searchState} />
      )}
      {currentTab === 'quantity' && <ContentEdit.Quantity item={currentChild} onFinish={goNext} />}
      <Spacer variant="drawer-footer-offset" />
    </DrawerLayout>
  );
};

export default observer(DishFoodAdd);
