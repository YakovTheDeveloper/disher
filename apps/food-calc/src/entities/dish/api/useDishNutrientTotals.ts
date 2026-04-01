import { useMemo } from 'react';
import { useDishItems } from './queries';
import { useNutrientsByProductIds } from '@/entities/product';
import { calculateDishNutrients, type NutrientTotals } from '@/shared/lib/nutrients';

export function useDishNutrientTotals(dishId: string | undefined): NutrientTotals {
  const items = useDishItems(dishId);

  const productIds = useMemo(
    () => [...new Set(items.map((i) => i.productId))],
    [items],
  );

  const nutrientsMap = useNutrientsByProductIds(productIds);

  return useMemo(() => {
    if (!items.length) return {};

    return calculateDishNutrients(
      items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      nutrientsMap,
    );
  }, [items, nutrientsMap]);
}
