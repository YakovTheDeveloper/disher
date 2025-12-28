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

type Props = {
  children?: React.ReactNode;
  foodId: string;
};

const FoodNutrients = ({ foodId }: Props) => {
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
