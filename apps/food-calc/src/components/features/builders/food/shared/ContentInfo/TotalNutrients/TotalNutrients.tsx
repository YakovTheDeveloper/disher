import { observer } from 'mobx-react-lite';
import styles from './TotalNutrients.module.scss';
import { Nutrients } from '@/components/features/builders/food/shared/ContentInfo/Nutrients';
import { useCallback, useMemo } from 'react';
import { Overlay } from '@/components/features/builders/food/shared/ContentInfo/Nutrients/Overlay';
import { Typography } from '@/components/ui/atoms/Typography';
import { NavLink } from 'react-router';
import { RouterLinks } from '@/router';
import { Instance } from 'mobx-state-tree';
import { DaySchedule } from '@/domain/schedule/schedule';
import { TotalNutrientsStore } from '@/components/features/builders/food/shared/ContentInfo/TotalNutrients/store/TotalNutrientsStore';

export interface TotalNutrientsRef {
  calculate: () => void;
}

type Props = {
  children: React.ReactNode;
  store: Instance<typeof DaySchedule>;
  ref: React.Ref<{
    calculate: () => void;
  }>;
};

const TotalNutrients = ({ store, ref, children }: Props) => {
  // const { prepareStore } = useTotalNutrients(store, ref);

  const nutrientStore = useMemo(() => TotalNutrientsStore.create(), []);
  nutrientStore.setEntity(store);

  const isLoading = useCallback(() => nutrientStore.isOneOfProductsIsLoading, [nutrientStore]);

  const renderOverlay = useCallback(
    (value: string) => <Overlay loading={isLoading}>{value}</Overlay>,
    [isLoading]
  );

  return (
    <div className={styles.container}>
      {/* <Button
        onClick={async () => {
          const nutrients = await nutrientStore.loadNutrientsAndCalculate();
          console.log('nutrientStore.nutrients', nutrients);
        }}
      >
        Го
      </Button> */}
      <Nutrients store={nutrientStore} renderOverlay={renderOverlay} />
      <NavLink to={RouterLinks.DailyNorms}>
        <Typography variant="action">поменять норму</Typography>
      </NavLink>
      {children}

      {store.foodWithNoNutrients.length && (
        <div className={styles.messageContainer}>
          <p>Без продуктов</p>
          <div className={styles.messageContainerRow}>
            {store.foodWithNoNutrients.map((food) => (
              <span key={food.id}>{food.name}</span>
            ))}{' '}
          </div>
          <p>(нет данных по ценности)</p>
        </div>
      )}

      {store.customItems.length && (
        <div className={styles.messageContainer}>
          <p>Расчет производится без учета кастомных продуктов</p>
          <div className={styles.messageContainerRow}>
            Продукты:{' '}
            {store.customItems.map(({ content }) => (
              <span key={content.name}>{content.name}</span>
            ))}{' '}
          </div>
          <p>не были учтены</p>
        </div>
      )}
    </div>
  );
};

export default observer(TotalNutrients);
