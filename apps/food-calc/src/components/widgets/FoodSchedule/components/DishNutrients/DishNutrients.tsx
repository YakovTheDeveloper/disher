import styles from './DishNutrients.module.scss';
import { Nutrients } from '@/components/entities/nutrient/NutrientGroup';
import { Overlay } from '@/components/entities/nutrient/NutrientGroup/Overlay';
import NutrientCardV2 from '@/components/entities/nutrient/NutrientCard/NutrientCardV2';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Typography } from '@/components/ui/atoms/Typography';
import { NavLink } from 'react-router';
import { RouterLinks } from '@/router';
import clsx from 'clsx';
import { TotalNutrientsStore } from '@/components/features/builders/TotalNutrients/TotalNutrients/store/TotalNutrientsStore';
import type { ScheduleFood } from '@/entities/schedule-food';
import type { Dish } from '@/entities/dish';
import { useSchedule } from '@/components/features/builders/ScheduleBuilder/context';
import { Button } from '@/components/ui/atoms/Button';
import { drawerStore } from '@/shared/ui/drawer-store';

type Props = {
  currentChild: ScheduleFood;
  currentDish: Dish;
};

const DishNutrients = ({ currentChild, currentDish }: Props) => {
  const schedule = useSchedule();

  const [currentTab, setCurrentTab] = useState('');

  const nutrientStore = useMemo(() => TotalNutrientsStore.create(), []);
  nutrientStore.setEntity(currentDish);

  useEffect(() => {
    nutrientStore.loadNutrientsAndCalculate();
  }, [currentTab]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => currentChild.content.updateQuantity(+e.target.value);

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
          <input type="number" onChange={onChange} value={currentChild.content.quantity} />
        </div>
      </header>

      <div className={styles.main}>
        <div className={styles.content}>
          <Nutrients
            renderOverlay={renderOverlay}
            store={nutrientStore}
            asControlledForm={false}
            renderCard={(nutrientData) => (
              <NutrientCardV2
                content={nutrientData}
                getValue={nutrientStore.getValue}
                renderOverlay={renderOverlay}
              />
            )}
          />
          <Button
            variant="ghost"
            className={styles.link}
            onClick={() => {
              // TODO: implement daily norm chooser with drawerStore.show()
            }}
          >
            поменять норму
          </Button>
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

export default DishNutrients;
