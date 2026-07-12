import { memo } from 'react';
import { NutrientMeterView } from '@/entities/nutrient/ui/NutrientMeterView';
import { useNutrientTotals } from '@/shared/lib/useNutrientTotals';
import type { NutrientTotals } from '@/shared/lib/nutrients';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { DailyNormButton } from '@/features/dailyNorms/DailyNormButton';
import { Text } from '@/shared/ui/atoms/Typography/Text';
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
      <div className={styles.normRow}>
        <DailyNormButton />
      </div>
      <NutrientMeterView getValue={getValue} />
      {missingNutrientNames.length > 0 && (
        <Text role="caption" className={styles.missing}>
          Нет данных о нутриентах: {missingNutrientNames.join(', ')}
        </Text>
      )}
    </div>
  );
};

export default memo(FoodsNutrients);
