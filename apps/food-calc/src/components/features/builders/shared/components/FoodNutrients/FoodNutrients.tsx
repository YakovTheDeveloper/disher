import styles from './FoodNutrients.module.scss';
import { Nutrients } from '@/components/entities/nutrient/NutrientGroup';
import NutrientCardV2 from '@/components/entities/nutrient/NutrientCard/NutrientCardV2';
import { useCallback, useMemo } from 'react';
import { Overlay } from '@/components/entities/nutrient/NutrientGroup/Overlay';
import { Typography } from '@/components/ui/atoms/Typography';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import { TotalNutrientsStore } from '@/components/features/builders/TotalNutrients/TotalNutrients/store/TotalNutrientsStore';
import clsx from 'clsx';
import { Button } from '@/components/ui/atoms/Button';

type Props = {
  children?: React.ReactNode;
  before?: React.ReactNode;
  className?: string;
  foodId: string;
};

const FoodNutrients = ({ foodId, className, before }: Props) => {
  if (!foodId) return null;
  // TODO: replace with Triplit useEntity query
  const food = null as any; // TODO: get food entity from Triplit
  if (!food) return null;

  const nutrientStore = useMemo(
    () =>
      TotalNutrientsStore.create(),
    []
  );
  nutrientStore.setEntity(food);

  const onChange = (_value: number | null) => {
    // TODO: migrate to Triplit — setQuantity not available on TotalNutrientsStore
  };

  const isLoading = useCallback(() => nutrientStore.isOneOfProductsIsLoading, [nutrientStore]);

  const renderOverlay = useCallback(
    (value: string) => <Overlay loading={isLoading}>{value}</Overlay>,
    [isLoading]
  );

  return (
    <div className={clsx([styles.container, className])}>
      <header className={styles.header}>
        {before}
        <Typography variant="feature-title" className={styles.foodName}>{food.name}</Typography>
        <NumberInput
          color="white"
          size="small"
          className={styles.numberInput}
          onChange={onChange}
          value={100}
          placeholder="кол-во"
        />
      </header>
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
      <Button
        variant="ghost"
        className={styles.link}
        onClick={() => {
          // TODO: implement daily norm chooser with drawerStore.show()
        }}
      >
        поменять норму
      </Button>
    </div>
  );
};

export default FoodNutrients;
