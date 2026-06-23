import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { Heading } from '@/shared/ui/atoms/Typography';
import { FoodsNutrients } from '@/widgets/nutrients/FoodsNutrients';
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
 * Норма больше не редактируется внутри этого дровера — `FoodsNutrients` рисует
 * `DailyNormButton` вверху списка, который открывает отдельный `DailyNormDrawer`
 * (bottom-sheet). Этот компонент — только разбор нутриентов.
 */
export function NutrientsDrawer({
  totals,
  missingNutrientNames,
  isLoading,
  viewTitle,
}: NutrientsDrawerProps) {
  const title = viewTitle ?? 'Нутриенты';

  return (
    <DrawerLayout a11yLabel={title} hideTopChrome>
      <div className={styles.header}>
        <Heading role="headline" as="h2" className={styles.title}>
          {title}
        </Heading>
      </div>
      <div className={styles.body}>
        <FoodsNutrients
          totals={totals}
          missingNutrientNames={missingNutrientNames}
          isLoading={isLoading}
        />
      </div>
    </DrawerLayout>
  );
}

export default NutrientsDrawer;
