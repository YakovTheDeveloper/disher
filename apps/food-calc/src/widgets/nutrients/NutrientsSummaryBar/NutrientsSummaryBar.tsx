import { memo, useCallback } from 'react';
import { drawerStore } from '@/shared/ui';
import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { FoodsNutrients } from '@/widgets/nutrients/FoodsNutrients';
import type { NutrientTotals } from '@/shared/lib/nutrients';
import styles from './NutrientsSummaryBar.module.scss';

const ENERGY_ID = '7';
const PROTEIN_ID = '1';

type Props = {
  totals: NutrientTotals;
  missingNutrientNames?: string[];
  isLoading?: boolean;
};

type DrawerProps = BaseDrawerProps<void> & {
  totals: NutrientTotals;
  missingNutrientNames?: string[];
  isLoading?: boolean;
};

const NutrientsDrawer = ({ totals, missingNutrientNames, isLoading }: DrawerProps) => (
  <DrawerLayout>
    <div className={styles.drawerBody}>
      <FoodsNutrients
        totals={totals}
        missingNutrientNames={missingNutrientNames}
        isLoading={isLoading}
      />
    </div>
  </DrawerLayout>
);

const NutrientsSummaryBar = ({ totals, missingNutrientNames, isLoading }: Props) => {
  const energy = totals[ENERGY_ID] ?? 0;
  const protein = totals[PROTEIN_ID] ?? 0;
  const hasData = energy > 0 || protein > 0;

  const handleOpen = useCallback(() => {
    drawerStore.show(NutrientsDrawer, { totals, missingNutrientNames, isLoading });
  }, [totals, missingNutrientNames, isLoading]);

  return (
    <button
      type="button"
      className={styles.bar}
      onClick={handleOpen}
      aria-label="Открыть детали по нутриентам"
    >
      {hasData ? (
        <>
          <span className={styles.metric}>
            <span className={styles.metricValue}>{Math.round(energy)}</span>
            <span className={styles.metricUnit}>ккал</span>
          </span>
          <span className={styles.divider} />
          <span className={styles.metric}>
            <span className={styles.metricValue}>{Math.round(protein)}</span>
            <span className={styles.metricUnit}>г белка</span>
          </span>
        </>
      ) : (
        <span className={styles.empty}>Тапни — детали по нутриентам</span>
      )}
    </button>
  );
};

export default memo(NutrientsSummaryBar);
