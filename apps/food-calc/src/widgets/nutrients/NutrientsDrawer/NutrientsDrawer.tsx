import { NutrientShowcaseDrawer } from '@/features/food/quick-view-drawer';
import { FeatureErrorBoundary } from '@/shared/ui/error/FeatureErrorBoundary';
import type { NutrientTotals } from '@/shared/lib/nutrients';
import type { BaseDrawerProps } from '@/shared/ui';

export interface NutrientsDrawerProps extends BaseDrawerProps {
  /** Day / dish nutrient totals — captured at `show()` time. */
  totals: NutrientTotals;
  missingNutrientNames?: string[];
  isLoading?: boolean;
  /**
   * Overrides the «Нутриенты» title — например, имя блюда со страницы
   * конструктора (подзаголовок тогда говорит базис: «За блюдо»).
   */
  viewTitle?: string;
  /**
   * Тихий контекст под заголовком: «За весь день» (HomePage) / «За блюдо»
   * (DishBuilderPage). Дефолт — дневной: самый частый вход.
   */
  subtitle?: string;
}

/**
 * Store-driven дровер нутриентной сводки (день / блюдо) — тонкая read-only
 * обёртка над общим каркасом `NutrientShowcaseDrawer` (2026-07-25: бывший
 * боковой дровер на FoodsNutrients слит с быстрым нижним в одну bottom-sheet
 * витрину). Базиса и страницы сущности у суммы нет — передаём только totals,
 * сноску о позициях без данных и тексты шапки.
 *
 * Открытие: `drawerStore.show(NutrientsDrawer, props, QUICK_VIEW_DRAWER_OPTIONS)`.
 */
export function NutrientsDrawer({
  totals,
  missingNutrientNames,
  isLoading,
  viewTitle,
  subtitle = 'За весь день',
  onClose,
}: NutrientsDrawerProps) {
  const title = viewTitle ?? 'Нутриенты';

  return (
    <FeatureErrorBoundary label={title}>
      <NutrientShowcaseDrawer
        title={title}
        subtitle={subtitle}
        nutrients={totals}
        hasNutrients={Object.keys(totals).length > 0}
        loading={isLoading}
        missingNutrientNames={missingNutrientNames}
        // У суммы дня/блюда нет страницы, куда отправить за недостающим, —
        // нейтральная констатация вместо подсказки про страницу.
        emptyHint="Нет данных о нутриентах"
        onClose={onClose}
      />
    </FeatureErrorBoundary>
  );
}

export default NutrientsDrawer;
