import clsx from 'clsx';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { Heading } from '@/shared/ui/atoms/Typography';
import { FoodsNutrients } from '@/widgets/nutrients/FoodsNutrients';
import { useNutrientNormSlots } from '@/features/dailyNorms/NutrientNormDrawerControl';
import type { NutrientTotals } from '@/shared/lib/nutrients';
import type { BaseDrawerProps } from '@/shared/ui';
import styles from './NutrientsDrawer.module.scss';

export interface NutrientsDrawerProps extends BaseDrawerProps {
  /** Day / dish / product nutrient totals — captured at `show()` time. */
  totals: NutrientTotals;
  missingNutrientNames?: string[];
  isLoading?: boolean;
  /**
   * Overrides the view-mode title. Used by the catalog-product drawer to show
   * the food name instead of the generic «Нутриенты». Ignored in edit/create
   * mode, where the norm-form title always wins.
   */
  viewTitle?: string;
}

/**
 * Store-driven side drawer for the nutrient breakdown. Opened via
 * `drawerStore.show(NutrientsDrawer, props, { side: 'left' })`.
 *
 * `useNutrientNormSlots` is mode-stateful (view ↔ edit/create). On the store
 * path each `show()` is a fresh mount, so the mode always starts at 'view' —
 * no `isOpen` reset wiring needed.
 */
export function NutrientsDrawer({
  totals,
  missingNutrientNames,
  isLoading,
  viewTitle,
}: NutrientsDrawerProps) {
  const slots = useNutrientNormSlots();
  // viewTitle replaces «Нутриенты» only in view mode (bodyContent == null).
  const title = viewTitle != null && slots.bodyContent == null ? viewTitle : slots.title;
  // Panel mode = the nested norm form (edit/create) is rendered as body.
  // The drawer surface owns the warm fill and drops its own padding so the
  // form's padding is the single edge inset (industry canon: one owner).
  const isPanelMode = slots.bodyContent != null;

  return (
    <DrawerLayout
      a11yLabel={title}
      hideTopChrome
      className={isPanelMode ? styles.contentWarm : undefined}
    >
      <div className={clsx(styles.header, isPanelMode && styles.headerWarm)}>
        <Heading size="drawer" as="h2" className={styles.title}>
          {title}
        </Heading>
        {slots.headerAction != null && (
          <div className={styles.headerAction}>{slots.headerAction}</div>
        )}
      </div>
      <div className={clsx(styles.body, isPanelMode && styles.bodyFlush)}>
        {slots.bodyContent ?? (
          <>
            {slots.devToggle}
            {slots.emptyStateBanner}
            <FoodsNutrients
              totals={totals}
              missingNutrientNames={missingNutrientNames}
              isLoading={isLoading}
            />
          </>
        )}
      </div>
    </DrawerLayout>
  );
}

export default NutrientsDrawer;
