import { observer } from 'mobx-react-lite';
import styles from './Nutrients.module.scss';
import {
  NutrientContentItem,
  nutrientGroups,
} from '@/components/features/builders/food/shared/ContentInfo/Nutrients/constants';
import { useEffect } from 'react';
import { NutrientCard } from '@/components/features/builders/food/shared/ContentInfo/Nutrients/NutrientCard';
import { Instance } from 'mobx-state-tree';
import { TotalNutrientsStore } from '@/components/features/builders/food/shared/ContentInfo/TotalNutrients/store/TotalNutrientsStore';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import clsx from 'clsx';

// Groups of nutrients
// const groups: Record<string, number[]> = {
//   Макронутриенты: [1, 2, 3, 4, 5, 6, 7, 8],
//   Минералы: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
//   Витамины: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33],
//   Каротиноиды: [34, 35],
// };

type FoodId = string;

type Props = {
  renderOverlay?: (percent: string) => React.ReactNode;
  store: Instance<typeof TotalNutrientsStore>;
  progressType?: 'bar' | 'circle';
};

const Nutrients = ({ store, renderOverlay, progressType = 'bar' }: Props) => {
  useEffect(() => {
    console.log('new store nutrients', Array.from(store.nutrients.entries()));
  }, [Array.from(store.nutrients.entries())]);

  return (
    <div className={clsx([styles.container, styles[progressType]])}>
      {nutrientGroups.map(({ content, displayName: groupName }) => (
        <div key={groupName} className={styles.group}>
          <h3 className={styles.groupTitle}>
            <ScreenLabel opacity={0.2} fontSize={15} letterSpacing={'1px'}>
              {groupName}
            </ScreenLabel>
          </h3>
          <div className={clsx([styles.groupContent])}>
            {content.map((nutrientData: NutrientContentItem) => (
              <NutrientCard
                key={nutrientData.id}
                renderOverlay={renderOverlay}
                getValue={store.getValue}
                content={nutrientData}
                progressType={progressType}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default observer(Nutrients);
