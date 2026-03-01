import { observer } from 'mobx-react-lite';
import styles from './TotalNutrients.module.scss';
import { Nutrients } from '@/components/features/builders/TotalNutrients/Nutrients';
import { useCallback, useMemo } from 'react';
import { Overlay } from '@/components/features/builders/TotalNutrients/Nutrients/Overlay';
import { Typography } from '@/components/ui/atoms/Typography';
import { NavLink } from 'react-router';
import { RouterLinks } from '@/router';
import { Instance } from 'mobx-state-tree';
import { DaySchedule } from '@/domain/schedule/schedule.model';
import {
  NutrientsCountableEntity,
  TotalNutrientsStore,
} from '@/components/features/builders/TotalNutrients/TotalNutrients/store/TotalNutrientsStore';
import { Spacer } from '@/components/ui/atoms/Spacer';
import { Button } from '@/components/ui/atoms/Button';
import { useModalsAndDrawers } from '@/components/features/shared/hooks/useModalsAndDrawers';
import { DrawerTypesV2 } from '@/store/GlobalUiStore/DrawerStore/DrawerStore.v2.types';

export interface TotalNutrientsRef {
  calculate: () => void;
}

type Props = {
  children: React.ReactNode;
  countable: NutrientsCountableEntity & { customItems?: { name: string }[] };
  // store: Instance<typeof DaySchedule>;
  // ref: React.Ref<{
  //   calculate: () => void;
  // }>;
};

const TotalNutrients = ({ countable, children }: Props) => {
  return null;

  const nutrientStore = useMemo(() => TotalNutrientsStore.create(), []);
  nutrientStore.setEntity(countable);

  const isLoading = useCallback(() => nutrientStore.isOneOfProductsIsLoading, [nutrientStore]);

  const renderOverlay = useCallback(
    (value: string) => <Overlay loading={isLoading}>{value}</Overlay>,
    [isLoading]
  );

  return (
    <>
      <Spacer variant="screen-header-offset" />
      {/* <Button
        onClick={async () => {
          const nutrients = await nutrientStore.loadNutrientsAndCalculate();
          console.log('nutrientStore.nutrients', nutrients);
        }}
      >
        Го
      </Button> */}
      <Nutrients store={nutrientStore} renderOverlay={renderOverlay} asControlledForm={false} />
      <Button
        variant="ghost"
        onClick={() =>
          useModalsAndDrawers().drawerStore.open({ type: DrawerTypesV2.DailyNorm.Choose })
        }
      >
        поменять норму
      </Button>
      {children}

      {countable.foodWithNoNutrients.length && (
        <div className={styles.messageContainer}>
          <p>Без продуктов</p>
          <div className={styles.messageContainerRow}>
            {countable.foodWithNoNutrients.map((food) => (
              <span key={food.id}>{food.name}</span>
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

export default observer(TotalNutrients);
