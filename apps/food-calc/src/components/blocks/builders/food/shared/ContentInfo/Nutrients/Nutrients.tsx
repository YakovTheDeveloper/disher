import { observer } from 'mobx-react-lite';
import styles from './Nutrients.module.scss';
import { FoodModelStore } from '@/store/models/food/foodModelStore';
import { nutrientGroups } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients/constants';
import { useCallback, useEffect, useMemo } from 'react';
import { NutrientCard } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients/NutrientCard';
import { NutrientViewModelStore } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients/model/NutrientsViewModel';
import { foodStore } from '@/store/rootStore';

// Groups of nutrients
// const groups: Record<string, number[]> = {
//   Макронутриенты: [1, 2, 3, 4, 5, 6, 7, 8],
//   Минералы: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
//   Витамины: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33],
//   Каротиноиды: [34, 35],
// };

type Props = {
  getFood?: () => FoodModelStore;
  currentFood: { quantity: number; id: number }[];
  renderOverlay?: (percent: string) => React.ReactNode;
};

const Nutrients = ({ getFood = () => foodStore, currentFood, renderOverlay }: Props) => {
  const foodModel = getFood();

  const store = useMemo(() => new NutrientViewModelStore(foodModel), []);

  const getSum = useCallback(store.getValue, []);

  useEffect(() => {
    store.currentFood = currentFood;
  }, [currentFood, store]);

  return (
    <div className={styles.container}>
      {nutrientGroups.map(({ content, displayName: groupName }) => (
        <div key={groupName} className={styles.group}>
          <h3 className={styles.groupTitle}>{groupName}</h3>
          <div className={styles.groupContent}>
            {content.map((nutrientData) => (
              <NutrientCard
                key={nutrientData.id}
                renderOverlay={renderOverlay}
                getValue={getSum}
                content={nutrientData}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default observer(Nutrients);
