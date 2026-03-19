import { useMemo } from 'react';
import { useScheduleFoods } from './queries';
import { useDishItemsByDishIds } from '@/entities/dish';
import { useProductsByIds } from '@/entities/product';
import {
  calculateProductNutrients,
  calculateDishNutrients,
  sumNutrients,
  type NutrientTotals,
  type NutrientEntry,
} from '@/shared/lib/nutrients';

export function useScheduleNutrientTotals(date: string): NutrientTotals {
  const { results: scheduleFoods } = useScheduleFoods(date);
  const sfItems = scheduleFoods ?? [];

  const foodItems = useMemo(
    () => sfItems.filter((sf) => sf.type === 'food' && sf.foodId),
    [sfItems],
  );
  const dishItems = useMemo(
    () => sfItems.filter((sf) => sf.type === 'dish' && sf.dishId),
    [sfItems],
  );

  const dishIds = useMemo(
    () => [...new Set(dishItems.map((d) => d.dishId!))],
    [dishItems],
  );

  const { results: allDishItems } = useDishItemsByDishIds(dishIds);

  // Collect ALL food IDs: from direct food items + from dish items' foods
  const allFoodIds = useMemo(() => {
    const ids = new Set<string>();
    for (const fi of foodItems) if (fi.foodId) ids.add(fi.foodId);
    for (const di of allDishItems ?? []) ids.add(di.foodId);
    return [...ids];
  }, [foodItems, allDishItems]);

  const { results: foods } = useProductsByIds(allFoodIds);

  return useMemo(() => {
    if (!foods) return {};

    // Build nutrient map for all foods
    const nutrientsMap = new Map<string, NutrientEntry[]>();
    for (const food of foods) {
      const nutrients = food.nutrients
        ? Array.from(food.nutrients.values()).map((n) => ({
            nutrientId: n.nutrientId,
            quantity: n.quantity,
          }))
        : [];
      nutrientsMap.set(food.id, nutrients);
    }

    const totalsArray: NutrientTotals[] = [];

    // Food-type schedule items
    for (const fi of foodItems) {
      const nutrients = nutrientsMap.get(fi.foodId!);
      if (nutrients) {
        totalsArray.push(calculateProductNutrients(nutrients, fi.quantity));
      }
    }

    // Dish-type schedule items
    for (const di of dishItems) {
      const diItems = (allDishItems ?? []).filter(
        (item) => item.dishId === di.dishId!,
      );
      if (diItems.length > 0) {
        totalsArray.push(
          calculateDishNutrients(
            diItems.map((item) => ({ foodId: item.foodId, quantity: item.quantity })),
            nutrientsMap,
            di.quantity,
          ),
        );
      }
    }

    return sumNutrients(...totalsArray);
  }, [foodItems, dishItems, allDishItems, foods]);
}
