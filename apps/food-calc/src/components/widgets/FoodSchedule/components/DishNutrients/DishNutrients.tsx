import styles from './DishNutrients.module.scss';
import { Nutrients } from '@/components/entities/nutrient/NutrientGroup';
import { Overlay } from '@/components/entities/nutrient/NutrientGroup/Overlay';
import NutrientCardV2 from '@/components/entities/nutrient/NutrientCard/NutrientCardV2';

import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { TotalNutrientsStore } from '@/components/features/builders/TotalNutrients/TotalNutrients/store/TotalNutrientsStore';
import type { ScheduleFood } from '@/entities/schedule-food';
import type { Dish } from '@/entities/dish';
import { Button } from '@/components/ui/atoms/Button';

type Props = {
  currentChild: ScheduleFood;
  currentDish: Dish;
};

const DishNutrients = ({ currentChild, currentDish }: Props) => {
  const [currentTab, _setCurrentTab] = useState('');

  const nutrientStore = useMemo(() => TotalNutrientsStore.create(), []);
  // TODO: migrate to Triplit — currentDish doesn't satisfy NutrientsCountableEntity
  nutrientStore.setEntity(currentDish as any);

  useEffect(() => {
    nutrientStore.loadNutrientsAndCalculate();
  }, [currentTab]);

  // TODO: migrate to Triplit — content was MST computed property
  const childAny = currentChild as any;
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => childAny.content?.updateQuantity?.(+e.target.value);

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
          <input type="number" onChange={onChange} value={childAny.quantity ?? ''} />
        </div>
      </header>

      <div className={styles.main}>
        <div className={styles.content}>
          <Nutrients
            store={nutrientStore}
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
          {/* TODO: migrate to Triplit — currentDish.items was MST relation */}
        </nav>
      </div>
    </div>
  );
};

export default DishNutrients;
