import { observer } from 'mobx-react-lite';
import styles from './Nutrients.module.scss';
import { nutrientGroups } from '@/components/entities/nutrient/NutrientGroup/constants';
import React, { useEffect } from 'react';
import { Instance } from 'mobx-state-tree';
import { TotalNutrientsStore } from '@/components/features/builders/TotalNutrients/TotalNutrients/store/TotalNutrientsStore';
import clsx from 'clsx';
import { getNutrientColumn } from '@/components/entities/nutrient/NutrientGroup/constants/columnMapping';
import { Nutrient } from '@/components/entities/nutrient/NutrientGroup/constants';

// Groups of nutrients
// const groups: Record<string, number[]> = {
//   Макронутриенты: [1, 2, 3, 4, 5, 6, 7, 8],
//   Минералы: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
//   Витамины: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33],
//   Каротиноиды: [34, 35],
// };

interface Props {
  store: Instance<typeof TotalNutrientsStore>;
  renderCard: (nutrientData: Nutrient) => React.ReactNode;
}

const Nutrients = ({ store, renderCard }: Props) => {
  useEffect(() => {
    console.log('new store nutrients', Array.from(store.nutrients.entries()));
  }, [Array.from(store.nutrients.entries())]);

  return (
    <div className={clsx([styles.container])}>
      {nutrientGroups.map(({ content, displayName: groupName }) => {
        return (
          <div key={groupName} className={styles.group}>
            <div className={clsx([styles.groupContent])}>
              {/* <h2 className={styles.groupTitle}>{groupName}</h2> */}
              {content.map((nutrientData) => (
                <React.Fragment key={nutrientData.id}>{renderCard(nutrientData)}</React.Fragment>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default observer(Nutrients);
