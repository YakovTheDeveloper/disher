import styles from './TotalNutrients.module.scss';
import { Nutrients } from '@/components/entities/nutrient/NutrientGroup';
import { useCallback, useMemo } from 'react';
import { Overlay } from '@/components/entities/nutrient/NutrientGroup/Overlay';
import NutrientCardV2 from '@/components/entities/nutrient/NutrientCard/NutrientCardV2';
import {
  NutrientsCountableEntity,
  TotalNutrientsStore,
} from '@/components/features/builders/TotalNutrients/TotalNutrients/store/TotalNutrientsStore';
import { OpenDailyNorms } from '@/components/features/dailyNorms/OpenDailyNorms';
import { Ornament } from '@/components/ui/Ornament';

export interface TotalNutrientsRef {
  calculate: () => void;
}

type Props = {
  children: React.ReactNode;
  countable: NutrientsCountableEntity & { customItems?: { name: string }[] };
};

const TotalNutrients = ({ countable, children }: Props) => {
  const nutrientStore = useMemo(() => TotalNutrientsStore.create(), []);
  nutrientStore.setEntity(countable);

  const isLoading = useCallback(() => nutrientStore.isOneOfProductsIsLoading, [nutrientStore]);

  const renderOverlay = useCallback(
    (value: string) => <Overlay loading={isLoading}>{value}</Overlay>,
    [isLoading]
  );

  return (
    <>
      <Ornament text="нутриенты"></Ornament>
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
      <OpenDailyNorms />

      {children}

      {countable.foodWithNoNutrients.length > 0 && (
        <div className={styles.messageContainer}>
          <p>Без продуктов</p>
          <div className={styles.messageContainerRow}>
            {countable.foodWithNoNutrients.map((food) => (
              <span key={food.id}>{food.id}</span>
            ))}{' '}
          </div>
          <p>(нет данных по ценности)</p>
        </div>
      )}

      {countable.customItems?.length && (
        <div className={styles.messageContainer}>
          <p>Расчет производится без учета кастомных продуктов</p>
          <div className={styles.messageContainerRow}>
            Продукты:{' '}
            {countable.customItems.map(({ name }) => (
              <span key={name}>{name}</span>
            ))}{' '}
          </div>
          <p>не были учтены</p>
        </div>
      )}
    </>
  );
};

export default TotalNutrients;
