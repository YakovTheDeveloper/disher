import { observer } from 'mobx-react-lite';
import styles from './Nutrients.module.scss';
import { nutrientGroups } from '@/components/entities/nutrient/NutrientGroup/constants';
import React, { useEffect } from 'react';
import { NutrientCardFormEntry } from '@/components/entities/nutrient/NutrientCard';
import { Instance } from 'mobx-state-tree';
import { TotalNutrientsStore } from '@/components/features/builders/TotalNutrients/TotalNutrients/store/TotalNutrientsStore';
import clsx from 'clsx';
import { getNutrientColumn } from '@/components/entities/nutrient/NutrientGroup/constants/columnMapping';
import { NutrientContentItem } from '@/components/entities/nutrient/NutrientGroup/constants';

// Groups of nutrients
// const groups: Record<string, number[]> = {
//   Макронутриенты: [1, 2, 3, 4, 5, 6, 7, 8],
//   Минералы: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
//   Витамины: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33],
//   Каротиноиды: [34, 35],
// };

interface CommonProps {
  renderOverlay?: (percent: string) => React.ReactNode;
  store: Instance<typeof TotalNutrientsStore>;
}

type ConditionalProps =
  | {
      asControlledForm: true;
      onChange: (value: number, nutrientId: string) => void;
      getValue: (id: string) => number;
      renderCard?: never;
    }
  | {
      asControlledForm: false;
      onChange?: never;
      getValue?: never;
      renderCard: (nutrientData: NutrientContentItem) => React.ReactNode;
    };

type Props = CommonProps & ConditionalProps;

const Nutrients = ({
  store,
  renderOverlay,
  onChange,
  asControlledForm,
  getValue,
  renderCard,
}: Props) => {
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
              {content.map((nutrientData) =>
                asControlledForm ? (
                  <NutrientCardFormEntry
                    key={nutrientData.id}
                    onChange={onChange}
                    content={nutrientData}
                    getValue={getValue}
                    renderOverlay={renderOverlay}
                  />
                ) : (
                  <React.Fragment key={nutrientData.id}>{renderCard(nutrientData)}</React.Fragment>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default observer(Nutrients);
