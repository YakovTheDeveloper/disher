import styles from './FoodNutrients.module.scss';
import { Nutrients } from '@/components/entities/nutrient/NutrientGroup';
import NutrientCardV2 from '@/components/entities/nutrient/NutrientCard/NutrientCardV2';
import { Typography } from '@/components/ui/atoms/Typography';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import clsx from 'clsx';
import { Button } from '@/components/ui/atoms/Button';
import { useNutrientTotals } from '@/shared/lib/useNutrientTotals';
import type { NutrientTotals } from '@/shared/lib/nutrients';

type Props = {
  children?: React.ReactNode;
  before?: React.ReactNode;
  className?: string;
  foodName: string;
  totals: NutrientTotals;
};

const FoodNutrients = ({ foodName, totals, className, before }: Props) => {
  const { getValue } = useNutrientTotals(totals);

  const onChange = (_value: number | null) => {
    // TODO: migrate to Triplit — update quantity and recompute totals
  };

  return (
    <div className={clsx([styles.container, className])}>
      <header className={styles.header}>
        {before}
        <Typography variant="feature-title" className={styles.foodName}>{foodName}</Typography>
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
        renderCard={(nutrientData) => (
          <NutrientCardV2
            content={nutrientData}
            getValue={getValue}
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
