import { observer } from 'mobx-react-lite';
import styles from './DishNutrients.module.scss';
import { Nutrients } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients';
import { Overlay } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients/Overlay';

import {
  DayScheduleItemUI,
  DayScheduleUI,
} from '@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';
import { useCallback, useMemo, useState } from 'react';
import { Typography } from '@/components/ui/atoms/Typography';
import { NavLink } from 'react-router';
import { RouterLinks } from '@/router';
import { foodStore } from '@/store/rootStore';
import { PrepareProductsForCalculationStore } from '@/components/blocks/builders/food/shared/calculationFlowStore';
import { DishNutrientsViewModel } from '@/components/blocks/builders/food/ScheduleBuilder/components/DishNutrients/viewModel/DishNutrientsViewModel';
import clsx from 'clsx';
type Props = {
  children: React.ReactNode;
  vm: {
    currentChild: DayScheduleItemUI | null;
  };
};

const DishNutrients = ({ vm }: Props) => {
  if (!vm.currentChild?.dish) return null;

  const store = useMemo(() => new DishNutrientsViewModel(vm.currentChild), [vm, vm.currentChild]);

  const currentPrepareStore = store.prepareStore;

  const renderOverlay = useCallback(
    (value: string) => (
      <Overlay loading={foodStore.requestState} currentId={currentPrepareStore}>
        {value}
      </Overlay>
    ),
    [foodStore.requestState, currentPrepareStore]
  );

  return (
    <div className={styles.container}>
      <header className={styles.tabs}>
        <div
          className={clsx(styles.tab, {
            [styles.active]: !store.currentFoodId,
          })}
          onClick={() => store.setCurrentFoodId(null)}
        >
          {store.dishName}
        </div>

        {store.foodContent.map((item) => (
          <div
            key={item.food.id}
            className={clsx(styles.tab, {
              [styles.active]: item.food.id === store.currentFoodId,
            })}
            onClick={() => store.setCurrentFoodId(item.food.id)}
          >
            {item.food.name}
          </div>
        ))}
      </header>

      <div className={styles.content}>
        <Nutrients currentFood={currentPrepareStore.products} renderOverlay={renderOverlay} />
        <NavLink to={RouterLinks.DailyNorms} className={styles.link}>
          <Typography variant="action">поменять норму</Typography>
        </NavLink>
      </div>
    </div>
  );
};

export default observer(DishNutrients);
