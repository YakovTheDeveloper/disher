import { useMemo } from 'react';
import { useDishItems } from './queries';
import { useNutrientsByFoodIds } from '@/entities/product';
import { calculateDishNutrients, type NutrientTotals } from '@/shared/lib/nutrients';

export function useDishNutrientTotals(dishId: string | undefined): NutrientTotals {
  const { results: dishItems } = useDishItems(dishId);
  const items = dishItems ?? [];

  const foodIds = useMemo(
    () => [...new Set(items.map((i) => i.foodId))],
    [items],
  );

  const nutrientsMap = useNutrientsByFoodIds(foodIds);

  return useMemo(() => {
    if (!items.length) return {};

    return calculateDishNutrients(
      items.map((i) => ({ foodId: i.foodId, quantity: i.quantity })),
      nutrientsMap,
    );
  }, [items, nutrientsMap]);
}
