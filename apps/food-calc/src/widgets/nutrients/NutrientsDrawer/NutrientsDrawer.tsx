import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { FoodsNutrients } from '@/widgets/nutrients/FoodsNutrients';
import { NormLegendButton } from '@/features/dailyNorms/NormLegendButton';
import { FeatureErrorBoundary } from '@/shared/ui/error/FeatureErrorBoundary';
import type { NutrientTotals } from '@/shared/lib/nutrients';
import type { BaseDrawerProps } from '@/shared/ui';
import styles from './NutrientsDrawer.module.scss';

export interface NutrientsDrawerProps extends BaseDrawerProps {
  /** Day / dish / product nutrient totals — captured at `show()` time. */
  totals: NutrientTotals;
  missingNutrientNames?: string[];
  isLoading?: boolean;
  /**
   * Overrides the «Нутриенты» title. Used by the catalog-product drawer to show
   * the food name instead of the generic heading.
   */
  viewTitle?: string;
}

/**
 * Store-driven side drawer for the nutrient breakdown. Opened via
 * `drawerStore.show(NutrientsDrawer, props, { side: 'left' })`.
 *
 * Норма живёт чипом-легендой `NormLegendButton` в теле (2026-07-23 — кнопка-мишень
 * из хедера убрана во всех дроверах), который открывает модалку «Дневная норма».
 * Ниже — разбор нутриентов.
 */
export function NutrientsDrawer({
  totals,
  missingNutrientNames,
  isLoading,
  viewTitle,
}: NutrientsDrawerProps) {
  const title = viewTitle ?? 'Нутриенты';

  return (
    <DrawerLayout title={title} contentInset="panel">
      <div className={styles.body}>
        <NormLegendButton className={styles.normLegend} />
        <FeatureErrorBoundary label={title}>
          <FoodsNutrients
            totals={totals}
            missingNutrientNames={missingNutrientNames}
            isLoading={isLoading}
          />
        </FeatureErrorBoundary>
      </div>
    </DrawerLayout>
  );
}

export default NutrientsDrawer;
