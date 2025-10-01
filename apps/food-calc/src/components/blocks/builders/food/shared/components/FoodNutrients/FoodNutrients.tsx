import { observer } from 'mobx-react-lite';
import styles from './FoodNutrients.module.scss';
import { PrepareProductsForCalculationStore } from '@/components/blocks/builders/food/shared/calculationFlowStore';
import { Nutrients } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients';

import { RouterLinks } from '@/router';
import {
  getTotalFoodAndDishFoodQuantityFromAll,
  getTotalFoodAndDishFoodQuantityFromSchedule,
} from '@/store/models/schedule/schedule.domain';
import { NavLink } from 'react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Overlay } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients/Overlay';
import { foodStore } from '@/store/rootStore';
import { Typography } from '@/components/ui/atoms/Typography';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import { useDebounce } from 'use-debounce';

type Props = {
  children: React.ReactNode;
  vm: {
    currentChild: {
      food: {
        id: number;
        name: string;
      } | null;
      id: number;
      quantity: number;
    } | null;
  };
};

const FoodNutrients = ({ vm }: Props) => {
  const prepareStore = useMemo(() => new PrepareProductsForCalculationStore(), []);
  const [customQuantity, setCustomQuantity] = useState<number | null>(vm.currentChild?.quantity);
  const onChange = (value: number | null) => setCustomQuantity(value);

  const renderOverlay = useCallback(
    (value: string) => (
      <Overlay loading={foodStore.requestState} currentId={prepareStore}>
        {value}
      </Overlay>
    ),
    [foodStore.requestState, prepareStore]
  );

  const [debouncedQuantity] = useDebounce(customQuantity, 300);

  useEffect(() => {
    if (!vm.currentChild) return;
    const total = getTotalFoodAndDishFoodQuantityFromSchedule(
      vm.currentChild,
      debouncedQuantity ?? 0
    );
    prepareStore.onStart(total, '');
  }, [vm, vm.currentChild, debouncedQuantity]);

  return (
    <div className={styles.container}>
      <header>
        <Typography>информация</Typography>
        <Typography>{vm.currentChild?.food?.name}</Typography>
        <NumberInput onChange={onChange} value={customQuantity} placeholder="#ЗНАЧ!" />
      </header>
      <Nutrients currentFood={prepareStore.products} renderOverlay={renderOverlay} />
      <NavLink to={RouterLinks.DailyNorms} className={styles.link}>
        <Typography variant="action">поменять норму</Typography>
      </NavLink>
    </div>
  );
};

export default observer(FoodNutrients);
