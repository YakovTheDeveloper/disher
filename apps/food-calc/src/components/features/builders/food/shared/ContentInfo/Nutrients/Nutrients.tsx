import { observer } from 'mobx-react-lite';
import styles from './Nutrients.module.scss';
import {
  NutrientContentItem,
  nutrientGroups,
} from '@/components/features/builders/food/shared/ContentInfo/Nutrients/constants';
import { useEffect } from 'react';
import {
  NutrientCard,
  NutrientCardFormEntry,
} from '@/components/features/builders/food/shared/ContentInfo/Nutrients/NutrientCard';
import { Instance } from 'mobx-state-tree';
import { TotalNutrientsStore } from '@/components/features/builders/food/shared/ContentInfo/TotalNutrients/store/TotalNutrientsStore';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import clsx from 'clsx';
import NutrientCardV2 from '@/components/features/builders/food/shared/ContentInfo/Nutrients/NutrientCard/NutrientCardV2';

// Groups of nutrients
// const groups: Record<string, number[]> = {
//   Макронутриенты: [1, 2, 3, 4, 5, 6, 7, 8],
//   Минералы: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
//   Витамины: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33],
//   Каротиноиды: [34, 35],
// };

type FoodId = string;

interface CommonProps {
  renderOverlay?: (percent: string) => React.ReactNode;
  store: Instance<typeof TotalNutrientsStore>;
}

type ConditionalProps =
  | {
      asControlledForm: true;
      onChange: (value: number, nutrientId: string) => void;
      getValue: (id: string) => number;
    }
  | {
      asControlledForm: false;
      onChange?: never;
      getValue?: never;
    };

type Props = CommonProps & ConditionalProps;

const Nutrients = ({ store, renderOverlay, onChange, asControlledForm, getValue }: Props) => {
  useEffect(() => {
    console.log('new store nutrients', Array.from(store.nutrients.entries()));
  }, [Array.from(store.nutrients.entries())]);

  return (
    <div className={clsx([styles.container])}>
      {nutrientGroups.map(({ content, displayName: groupName }) => (
        <div key={groupName} className={styles.group}>
          <h3 className={styles.groupTitle}>
            <ScreenLabel variant="nutrients" opacity={0.2}>
              {groupName}
            </ScreenLabel>
          </h3>
          <div className={clsx([styles.groupContent])}>
            {content.map((nutrientData: NutrientContentItem) => {
              return asControlledForm ? (
                <NutrientCardFormEntry
                  onChange={onChange}
                  content={nutrientData}
                  getValue={getValue}
                  renderOverlay={renderOverlay}
                />
              ) : (
                <NutrientCardV2
                  content={nutrientData}
                  getValue={store.getValue}
                  renderOverlay={renderOverlay}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default observer(Nutrients);
