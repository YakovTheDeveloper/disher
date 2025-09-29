import { observer } from 'mobx-react-lite';
import styles from './TotalNutrients.module.scss';
import { Nutrients } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients';
import { DayScheduleUI } from '@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';
import { useCallback, useRef, useEffect, useMemo } from 'react';
import { foodStore } from '@/store/rootStore';
import { Overlay } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients/Overlay';
import { Typography } from '@/components/ui/atoms/Typography';
import { NavLink } from 'react-router';
import { RouterLinks } from '@/router';
import { PrepareProductsForCalculationStore } from '@/components/blocks/builders/food/shared/calculationFlowStore';
import { NutrientsEventEmitter } from '@/components/blocks/builders/food/shared/emitter';
import { TotalNutrientsViewModel } from '@/components/blocks/builders/food/shared/ContentInfo/TotalNutrients/viewModel/TotalNutrientsViewModel';

type Props = {
  children: React.ReactNode;
  vm: {
    schedule: DayScheduleUI;
  };
};

const TotalNutrients = ({ vm }: Props) => {
  const prepareStore = useMemo(() => new PrepareProductsForCalculationStore(), []);

  const calculationStore = useMemo(
    () => new TotalNutrientsViewModel(vm, prepareStore),
    [vm, prepareStore]
  );

  console.log('TotalNutrients render');

  const renderOverlay = useCallback(
    (value: string) => (
      <Overlay loading={foodStore.requestState} currentId={prepareStore}>
        {value}
      </Overlay>
    ),
    [foodStore.requestState, prepareStore]
  );

  const getFoodModel = useCallback(() => foodStore, []);
  return (
    <div className={styles.container}>
      <Nutrients
        currentFood={prepareStore.products}
        getFood={getFoodModel}
        renderOverlay={renderOverlay}
      />
      <NavLink to={RouterLinks.DailyNorms}>
        <Typography variant="action">поменять норму</Typography>
      </NavLink>
    </div>
  );
};

export default observer(TotalNutrients);
