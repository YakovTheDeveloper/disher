import { observer } from 'mobx-react-lite';
import styles from './FoodNutrients.module.scss';
import { Nutrients } from '@/components/features/builders/food/shared/ContentInfo/Nutrients';

import { RouterLinks } from '@/router';
import { NavLink } from 'react-router';
import { useCallback, useMemo } from 'react';
import { Overlay } from '@/components/features/builders/food/shared/ContentInfo/Nutrients/Overlay';
import { Typography } from '@/components/ui/atoms/Typography';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import { TotalNutrientsStore } from '@/components/features/builders/food/shared/ContentInfo/TotalNutrients/store/TotalNutrientsStore';
import { domainStore } from '@/store/store';
import clsx from 'clsx';

type Props = {
  children?: React.ReactNode;
  before?: React.ReactNode;
  className?: string;
  foodId: string;
};

const FoodNutrients = ({ foodId, className, before }: Props) => {
  // const [params] = useSearchParams();
  // const foodId = params.get('id');
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
    [isLoading]
  );

  return (
    <div className={clsx([styles.container, className])}>
      <header className={styles.header}>
        {before}
        <Typography className={styles.foodName}>{food.name}</Typography>
        <NumberInput
          color="white"
          size="small"
          className={styles.numberInput}
          onChange={onChange}
          value={nutrientStore.quantity}
          placeholder="кол-во"
        />
      </header>
      <Nutrients store={nutrientStore} renderOverlay={renderOverlay} asControlledForm={false} />
      <NavLink to={RouterLinks.DailyNorms} className={styles.link}>
        <Typography variant="action">поменять норму</Typography>
      </NavLink>
    </div>
  );
};

export default observer(FoodNutrients);
