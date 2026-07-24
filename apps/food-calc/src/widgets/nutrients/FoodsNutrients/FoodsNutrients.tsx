import { memo } from 'react';
import { useNutrientTotals } from '@/shared/lib/useNutrientTotals';
import type { NutrientTotals } from '@/shared/lib/nutrients';
import { FoodNutritionPanel } from '@/features/dailyNorms/FoodNutritionPanel';

type Props = {
  totals: NutrientTotals;
  missingNutrientNames?: string[];
  isLoading?: boolean;
  /** Инсет контента секций на --sys-inset-page слева — форвард в FoodNutritionPanel. */
  insetContent?: boolean;
  /** Тип еды («Блюдо») — ряд-шапка панели; форвард в FoodNutritionPanel. */
  type?: string;
};

/**
 * Read-only Nutrients-разбор по `totals` (сумма блюда / день) — тонкая обёртка над
 * общим `FoodNutritionPanel`: превращает `totals` в `getValue` (+ спиннер загрузки)
 * и отдаёт ядру. Продукт зовёт `FoodNutritionPanel` напрямую (свой getScaledValue).
 */
const FoodsNutrients = ({
  totals,
  missingNutrientNames,
  isLoading,
  insetContent,
  type,
}: Props) => {
  const { getValue } = useNutrientTotals(totals);

  return (
    <FoodNutritionPanel
      getValue={getValue}
      missingNutrientNames={missingNutrientNames}
      isLoading={isLoading}
      insetContent={insetContent}
      type={type}
    />
  );
};

export default memo(FoodsNutrients);
