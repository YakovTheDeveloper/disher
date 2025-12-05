import { observer } from 'mobx-react-lite';
import styles from './FoodNutrients.module.scss';
import { PrepareProductsForCalculationStore } from '@/components/blocks/builders/food/shared/calculationFlowStore';
import { Nutrients } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients';

import { RouterLinks } from '@/router';
import {
  getTotalFoodAndDishFoodQuantityFromAll,
  getTotalFoodAndDishFoodQuantityFromSchedule,
} from '@/store/models/schedule/schedule.domain';
import { NavLink, useSearchParams } from 'react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Overlay } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients/Overlay';
import { foodStore } from '@/store/rootStore';
import { Typography } from '@/components/ui/atoms/Typography';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import { useDebounce } from 'use-debounce';
import { Instance } from 'mobx-state-tree';
import { Food } from '@/domain/Food';
import { TotalNutrientsStore } from '@/components/blocks/builders/food/shared/ContentInfo/TotalNutrients/store/TotalNutrientsStore';
import { domainStore } from '@/store/store';
import { DaySchedule } from '@/domain/schedule/schedule';

type Props = {
  children?: React.ReactNode;
  store?: Instance<typeof DaySchedule>;
};

const FoodNutrients = ({}: Props) => {
  const [params] = useSearchParams();
  const foodId = params.get('id');
  if (!foodId) return null;
  const food = domainStore.foodStore.data.get(foodId);
  if (!food) return null;

  const nutrientStore = useMemo(
    () =>
      TotalNutrientsStore.create({
        quantity: 100,
      }),
    []
  );
  nutrientStore.setEntity(food);

  const onChange = (value: number | null) => nutrientStore.setQuantity(value || undefined);

  const isLoading = useCallback(() => nutrientStore.isOneOfProductsIsLoading, [nutrientStore]);

  const renderOverlay = useCallback(
    (value: string) => <Overlay loading={isLoading}>{value}</Overlay>,
    [foodStore.requestState]
  );

  return (
    <div className={styles.container}>
      <header>
        <Typography>информация</Typography>
        <Typography>{food.name}</Typography>
        <NumberInput onChange={onChange} value={nutrientStore.quantity} placeholder="#ЗНАЧ!" />
      </header>
      <Nutrients store={nutrientStore} renderOverlay={renderOverlay} />
      <NavLink to={RouterLinks.DailyNorms} className={styles.link}>
        <Typography variant="action">поменять норму</Typography>
      </NavLink>
    </div>
  );
};

export default observer(FoodNutrients);
