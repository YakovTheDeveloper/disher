import { useMemo } from 'react';
import { useDishItems } from './queries';
import { useProductsByIds } from '@/entities/product';
import { calculateDishNutrients, type NutrientTotals, type NutrientEntry } from '@/shared/lib/nutrients';

export function useDishNutrientTotals(dishId: string | undefined): NutrientTotals {
  const { results: dishItems } = useDishItems(dishId);
  const items = dishItems ?? [];

  const foodIds = useMemo(
    () => [...new Set(items.map((i) => i.foodId))],
    [items],
  );

  const { results: foods } = useProductsByIds(foodIds);

  return useMemo(() => {
    if (!items.length || !foods) return {};

    const productNutrientsMap = new Map<string, NutrientEntry[]>();
    for (const food of foods) {
      const nutrients = food.nutrients
        ? Array.from(food.nutrients.values()).map((n) => ({
            nutrientId: n.nutrientId,
            quantity: n.quantity,
          }))
        : [];
      productNutrientsMap.set(food.id, nutrients);
    }

    return calculateDishNutrients(
      items.map((i) => ({ foodId: i.foodId, quantity: i.quantity })),
      productNutrientsMap,
    );
  }, [items, foods]);
}
