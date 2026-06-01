import { memo } from 'react';
import NutrientTable from './NutrientTable';
import { useNutrientTotals } from '@/shared/lib/useNutrientTotals';
import type { NutrientTotals } from '@/shared/lib/nutrients';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import styles from './FoodsNutrients.module.scss';

type Props = {
  totals: NutrientTotals;
  missingNutrientNames?: string[];
  isLoading?: boolean;
};

const FoodsNutrients = ({ totals, missingNutrientNames = [], isLoading }: Props) => {
  const { getValue } = useNutrientTotals(totals);

  return (
    <div className={styles.root}>
      {isLoading && (
        <div className={styles.spinnerOverlay}>
          <Spinner size={16} />
        </div>
      )}
      <NutrientTable getValue={getValue} />
      {missingNutrientNames.length > 0 && (
        <p className={styles.missing}>
          Нет данных о нутриентах: {missingNutrientNames.join(', ')}
        </p>
      )}
    </div>
  );
};

export default memo(FoodsNutrients);
