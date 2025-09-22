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
import { CalculationFlowStore } from '@/components/blocks/builders/food/shared/calculationFlowStore';

type Props = {
  children: React.ReactNode;
  vm: {
    schedule: DayScheduleUI;
  };
};

const TotalNutrients = ({ vm }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const calculationStore = useMemo(() => new CalculationFlowStore(vm), [vm]);

  console.log('TotalNutrients render');

  const renderOverlay = useCallback(
    (value: string) => (
      <Overlay loading={foodStore.requestState} currentId={calculationStore}>
        {value}
      </Overlay>
    ),
    [foodStore.requestState, calculationStore]
  );

  const getFoodModel = useCallback(() => foodStore, []);
  return (
    <div className={styles.container} ref={containerRef}>
      <Nutrients
        currentFood={calculationStore.products}
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
