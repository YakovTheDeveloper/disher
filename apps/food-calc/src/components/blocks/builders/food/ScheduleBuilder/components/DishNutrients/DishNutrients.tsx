import { observer } from 'mobx-react-lite';
import styles from './DishNutrients.module.scss';
import { Nutrients } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients';
import { Overlay } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients/Overlay';

import {
  DayScheduleItemUI,
  DayScheduleUI,
} from '@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Typography } from '@/components/ui/atoms/Typography';
import { NavLink, useSearchParams } from 'react-router';
import { RouterLinks } from '@/router';
import { foodStore } from '@/store/rootStore';
import { PrepareProductsForCalculationStore } from '@/components/blocks/builders/food/shared/calculationFlowStore';
import { DishNutrientsViewModel } from '@/components/blocks/builders/food/ScheduleBuilder/components/DishNutrients/viewModel/DishNutrientsViewModel';
import clsx from 'clsx';
import { TotalNutrientsStore } from '@/components/blocks/builders/food/shared/ContentInfo/TotalNutrients/store/TotalNutrientsStore';
import { domainStore } from '@/store/store';
import { Instance } from 'mobx-state-tree';
import { DaySchedule, ScheduleItem } from '@/domain/schedule/schedule';
import { Dish } from '@/domain/dish/Dish';

const DishNutrientsWrapper = ({ store, children }: Props) => {
  const [params] = useSearchParams();
  const scheduleItemId = params.get('schedule-item-id');
  const dishId = params.get('dish-id');
  if (!dishId || !scheduleItemId) return null;

  const currentChild = store.getChildById(scheduleItemId);
  if (!currentChild) return null;

  const currentDish = domainStore.dishStore.data.get(dishId);

  if (!currentDish) return null;

  return <DishNutrients store={store} currentDish={currentDish} currentChild={currentChild} />;
};
type Props = {
  children?: React.ReactNode;
  store: Instance<typeof DaySchedule>;
  currentDish: Instance<typeof Dish>;
  currentChild: Instance<typeof ScheduleItem>;
};

const DishNutrients = ({ store, currentDish, currentChild }: Props) => {
  const [currentTab, setCurrentTab] = useState('');

  const nutrientStore = useMemo(() => TotalNutrientsStore.create(), [store]);
  nutrientStore.setEntity(currentDish);

  useEffect(() => {
    nutrientStore.loadNutrientsAndCalculate();
  }, [currentTab]);

  const onChange = (e) => currentChild.updateQuantity(+e.target.value);

  const isLoading = useCallback(() => nutrientStore.isOneOfProductsIsLoading, [nutrientStore]);

  const renderOverlay = useCallback(
    (value: string) => <Overlay loading={isLoading}>{value}</Overlay>,
    [foodStore.requestState]
  );

  return (
    <div className={styles.container}>
      <header className={styles.tabs}>
        <div
          className={clsx(styles.tab, {
            [styles.active]: true,
          })}
          onClick={() => {}}
        >
          {currentDish.name}
        </div>
        <div>
          <input type="number" onChange={onChange} value={currentChild.quantity} />
        </div>
      </header>

      <div className={styles.main}>
        <div className={styles.content}>
          <Nutrients renderOverlay={renderOverlay} store={nutrientStore} />
          <NavLink to={RouterLinks.DailyNorms} className={styles.link}>
            <Typography variant="action">поменять норму</Typography>
          </NavLink>
        </div>
        <nav className={styles.items}>
          {currentDish.items.map((item) => (
            <div
              key={item.food.id}
              className={clsx(styles.tab, {
                [styles.active]: currentTab === item.foodId,
              })}
              onClick={() => setCurrentTab(item.foodId)}
            >
              {item.food.name}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default observer(DishNutrientsWrapper);
