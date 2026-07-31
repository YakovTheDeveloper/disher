import { useTranslation } from 'react-i18next';
import { NutrientShowcaseDrawer } from '@/features/food/quick-view-drawer';
import { SuggestFood } from '@/features/food/food-suggest';
import { FeatureErrorBoundary } from '@/shared/ui/error/FeatureErrorBoundary';
import { modalStore } from '@/shared/ui/modal-store';
import { Button } from '@/shared/ui/atoms/Button';
import type { NutrientTotals } from '@/shared/lib/nutrients';
import type { BaseDrawerProps } from '@/shared/ui';
import s from './NutrientsDrawer.module.scss';

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
  /**
   * День расписания — включает кнопку матрицы «позиции дня × нутриенты» в шапке.
   * Передаёт только дневная витрина (FoodSchedule); «За блюдо» (DishBuilderPage)
   * дня не имеет и кнопку не получает.
   */
  date?: string;
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
  date,
  onClose,
}: NutrientsDrawerProps) {
  const { t } = useTranslation();
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
        date={date}
        // У суммы дня/блюда нет страницы, куда отправить за недостающим, —
        // нейтральная констатация вместо подсказки про страницу.
        emptyHint="Нет данных о нутриентах"
        // Вход в предложку «Что доесть?» — только у ДНЕВНОЙ витрины (date
        // передан из FoodSchedule/HomeTopBar): юзер уже видит дефициты этого
        // дня, модалка считает по ним же (useSuggestions(date)). Витрина
        // «За блюдо» (DishBuilderPage) дня не имеет — кнопки нет. Модалка
        // накрывает дровер сверху (канон: дровер под модалкой не закрываем).
        footer={
          date ? (
            <Button
              className={s.suggestEntry}
              variant="system-secondary"
              fullWidth
              trailingChevron
              onClick={() => void modalStore.show(SuggestFood, { date })}
            >
              {t('suggest.title', 'Что доесть?')}
            </Button>
          ) : undefined
        }
        onClose={onClose}
      />
    </FeatureErrorBoundary>
  );
}

export default NutrientsDrawer;
