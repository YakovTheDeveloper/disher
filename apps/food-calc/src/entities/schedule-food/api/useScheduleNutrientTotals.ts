import { useMemo } from 'react';
import { useScheduleFoods } from './queries';
import { useDishItemsByDishIds } from '@/entities/dish';
import { useNutrientsByProductIds } from '@/entities/product';
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
  const sfItems = useScheduleFoods(date);

  const foodItems = sfItems.filter((sf) => sf.type === 'food' && sf.productId);
  const dishItems = sfItems.filter((sf) => sf.type === 'dish' && sf.dishId);

  const dishIds = [...new Set(dishItems.map((d) => d.dishId!))];
  const allDishItems = useDishItemsByDishIds(dishIds);

  // Collect all unique productIds from schedule foods + dish items
  const allProductIds = useMemo(() => {
    const ids = new Set<string>();
    for (const fi of foodItems) if (fi.productId) ids.add(fi.productId);
    for (const di of allDishItems) ids.add(di.productId);
    return [...ids];
  }, [foodItems, allDishItems]);

  const nutrientsMap = useNutrientsByProductIds(allProductIds);

  const dataKey = sfItems
    .map((sf) => `${sf.id}:${sf.quantity}:${sf.type}:${sf.productId}:${sf.dishId}`)
    .join('|');

  return useMemo(() => {
    const totalsArray: NutrientTotals[] = [];
    const missingNames: string[] = [];

    for (const fi of foodItems) {
      const nutrients = nutrientsMap.get(fi.productId!);
      if (!nutrients || nutrients.length === 0) {
        const name = fi.product?.name ?? fi.productId!;
        if (!missingNames.includes(name)) missingNames.push(name);
      } else {
        totalsArray.push(calculateProductNutrients(nutrients, fi.quantity));
      }
    }

    for (const di of dishItems) {
      const diItems = allDishItems.filter((item) => item.dishId === di.dishId!);
      if (diItems.length > 0) {
        const dishMissing = diItems.some((item) => {
          const n = nutrientsMap.get(item.productId);
          return !n || n.length === 0;
        });
        if (dishMissing) {
          const dishName = di.dish?.name ?? di.dishId!;
          if (!missingNames.includes(dishName)) missingNames.push(dishName);
        }
        totalsArray.push(
          calculateDishNutrients(
            diItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
            nutrientsMap,
            di.quantity,
          ),
        );
      }
    }

    if (missingNames.length > 0) {
      console.warn(
        `[useScheduleNutrientTotals] Missing nutrients for: ${missingNames.join(", ")}. ` +
        `These items have no nutrient data.`,
      );
    }

    return {
      totals: sumNutrients(...totalsArray),
      missingNutrientNames: missingNames,
      isLoading: false,
    };
  }, [dataKey, allDishItems, nutrientsMap]);
}
