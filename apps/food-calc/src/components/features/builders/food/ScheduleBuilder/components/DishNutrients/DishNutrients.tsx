import { observer } from 'mobx-react-lite';
import styles from './DishNutrients.module.scss';
import { Nutrients } from '@/components/features/builders/food/shared/ContentInfo/Nutrients';
import { Overlay } from '@/components/features/builders/food/shared/ContentInfo/Nutrients/Overlay';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Typography } from '@/components/ui/atoms/Typography';
import { NavLink } from 'react-router';
import { RouterLinks } from '@/router';
import clsx from 'clsx';
import { TotalNutrientsStore } from '@/components/features/builders/food/shared/ContentInfo/TotalNutrients/store/TotalNutrientsStore';
import { Instance } from 'mobx-state-tree';
import { DaySchedule, ScheduleItem } from '@/domain/schedule/schedule';
import { Dish } from '@/domain/dish/Dish';
import { useSchedule } from '@/components/features/builders/food/ScheduleBuilder/context';

type Props = {
  currentChild: Instance<typeof ScheduleItem>;
  currentDish: Instance<typeof Dish>;
};

const DishNutrients = ({ currentChild, currentDish }: Props) => {
  const schedule = useSchedule();

  const [currentTab, setCurrentTab] = useState('');

  const nutrientStore = useMemo(() => TotalNutrientsStore.create(), []);
  nutrientStore.setEntity(currentDish);

  useEffect(() => {
    nutrientStore.loadNutrientsAndCalculate();
  }, [currentTab]);

  const onChange = (e) => schedule.updateQuantity(currentChild.id, +e.target.value);

  const isLoading = useCallback(() => nutrientStore.isOneOfProductsIsLoading, [nutrientStore]);

  const renderOverlay = useCallback(
    (value: string) => <Overlay loading={isLoading}>{value}</Overlay>,
    [isLoading]
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
          <Nutrients renderOverlay={renderOverlay} store={nutrientStore} asControlledForm={false} />
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

export default observer(DishNutrients);
