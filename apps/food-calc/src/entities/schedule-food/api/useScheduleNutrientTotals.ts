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

  // No useMemo — Triplit deduplicates queries via JSON.stringify internally
  const dishIds = [...new Set(dishItems.map((d) => d.dishId!))];
  const { results: allDishItems, fetching: fetchingDishItems } = useDishItemsByDishIds(dishIds);

  const allFoodIds = (() => {
    const ids = new Set<string>();
    for (const fi of foodItems) if (fi.foodId) ids.add(fi.foodId);
    for (const di of allDishItems ?? []) ids.add(di.foodId);
    return [...ids];
  })();
  const { results: foods, fetching: fetchingFoods } = useProductsByIds(allFoodIds);

  const isLoading = fetchingSchedule || fetchingDishItems || fetchingFoods;

  // String key captures all schedule item data — reliable value comparison
  const dataKey = sfItems
    .map((sf) => `${sf.id}:${sf.quantity}:${sf.type}:${sf.foodId}:${sf.dishId}`)
    .join('|');

  return useMemo(() => {
    if (!foods) return { totals: {}, missingNutrientNames: [], isLoading };

    const nutrientsMap = new Map<string, NutrientEntry[]>();
    const foodNameMap = new Map<string, string>();
    for (const food of foods) {
      const nutrients = food.nutrients
        ? Array.from(food.nutrients.values()).map((n) => ({
          nutrientId: n.nutrientId,
          quantity: n.quantity,
        }))
        : [];
      nutrientsMap.set(food.id, nutrients);
      foodNameMap.set(food.id, food.name);
    }

    const totalsArray: NutrientTotals[] = [];
    const missingNames: string[] = [];

    for (const fi of foodItems) {
      const nutrients = nutrientsMap.get(fi.foodId!);
      if (!nutrients || nutrients.length === 0) {
        const name = foodNameMap.get(fi.foodId!) ?? fi.food?.name ?? fi.foodId!;
        if (!missingNames.includes(name)) missingNames.push(name);
      } else {
        totalsArray.push(calculateProductNutrients(nutrients, fi.quantity));
      }
    }

    for (const di of dishItems) {
      const diItems = (allDishItems ?? []).filter(
        (item) => item.dishId === di.dishId!,
      );
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

    return {
      totals: sumNutrients(...totalsArray),
      missingNutrientNames: missingNames,
      isLoading,
    };
  }, [dataKey, allDishItems, foods, isLoading]);
}
