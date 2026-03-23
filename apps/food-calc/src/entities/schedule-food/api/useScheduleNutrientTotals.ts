import { useMemo } from 'react';
import { useScheduleFoods } from './queries';
import { useDishItemsByDishIds } from '@/entities/dish';
import { useNutrientsByFoodIds } from '@/entities/product';
import {
  calculateProductNutrients,
  calculateDishNutrients,
  sumNutrients,
  type NutrientTotals,
} from '@/shared/lib/nutrients';

export type ScheduleNutrientResult = {
  totals: NutrientTotals;
  missingNutrientNames: string[];
  isLoading: boolean;
};

export function useScheduleNutrientTotals(date: string): ScheduleNutrientResult {
  const { results: scheduleFoods, fetching: fetchingSchedule } = useScheduleFoods(date);
  const sfItems = scheduleFoods ?? [];

  const foodItems = sfItems.filter((sf) => sf.type === 'food' && sf.foodId);
  const dishItems = sfItems.filter((sf) => sf.type === 'dish' && sf.dishId);

  const dishIds = [...new Set(dishItems.map((d) => d.dishId!))];
  const { results: allDishItems, fetching: fetchingDishItems } = useDishItemsByDishIds(dishIds);

  // Collect all unique foodIds from schedule foods + dish items
  const allFoodIds = useMemo(() => {
    const ids = new Set<string>();
    for (const fi of foodItems) if (fi.foodId) ids.add(fi.foodId);
    for (const di of allDishItems ?? []) ids.add(di.foodId);
    return [...ids];
  }, [foodItems, allDishItems]);

  const nutrientsMap = useNutrientsByFoodIds(allFoodIds);

  const isLoading = fetchingSchedule || fetchingDishItems;

  const dataKey = sfItems
    .map((sf) => `${sf.id}:${sf.quantity}:${sf.type}:${sf.foodId}:${sf.dishId}`)
    .join('|');

  return useMemo(() => {
    const totalsArray: NutrientTotals[] = [];
    const missingNames: string[] = [];

    for (const fi of foodItems) {
      const nutrients = nutrientsMap.get(fi.foodId!);
      if (!nutrients || nutrients.length === 0) {
        const name = fi.food?.name ?? fi.foodId!;
        if (!missingNames.includes(name)) missingNames.push(name);
      } else {
        totalsArray.push(calculateProductNutrients(nutrients, fi.quantity));
      }
    }

    for (const di of dishItems) {
      const diItems = (allDishItems ?? []).filter((item) => item.dishId === di.dishId!);
      if (diItems.length > 0) {
        const dishMissing = diItems.some((item) => {
          const n = nutrientsMap.get(item.foodId);
          return !n || n.length === 0;
        });
        if (dishMissing) {
          const dishName = di.dish?.name ?? di.dishId!;
          if (!missingNames.includes(dishName)) missingNames.push(dishName);
        }
        totalsArray.push(
          calculateDishNutrients(
            diItems.map((item) => ({ foodId: item.foodId, quantity: item.quantity })),
            nutrientsMap,
            di.quantity,
          ),
        );
      }
    }

    if (missingNames.length > 0) {
      console.warn(
        `[useScheduleNutrientTotals] Missing nutrients for: ${missingNames.join(", ")}. ` +
        `These items have no nutrient data in Dexie or Triplit.`,
      );
    }

    return {
      totals: sumNutrients(...totalsArray),
      missingNutrientNames: missingNames,
      isLoading,
    };
  }, [dataKey, allDishItems, nutrientsMap, isLoading]);
}
