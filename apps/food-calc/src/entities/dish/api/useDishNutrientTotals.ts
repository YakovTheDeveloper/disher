import { useMemo } from 'react';
import { useDishItemsWithProducts } from './queries';
import { useNutrientsByProductIds } from '@/entities/product';
import { calculateDishNutrients, type NutrientTotals } from '@/shared/lib/nutrients';

export type DishNutrientResult = {
  totals: NutrientTotals;
  /**
   * Имена ингредиентов без нутриентных данных (user-продукт с пустыми nutrients
   * или осиротевший productId). Пробрасывается в `FoodsNutrients`, чтобы поверхности
   * блюда (страница + дровер) показывали «Нет данных…» вместо частичного тотала,
   * который выглядит полным — паритет с дневным разбором (`useScheduleNutrientTotals`).
   */
  missingNutrientNames: string[];
};

export function useDishNutrientTotals(dishId: string | undefined): DishNutrientResult {
  const items = useDishItemsWithProducts(dishId);

  const productIds = useMemo(
    () => [...new Set(items.map((i) => i.productId))],
    [items],
  );

  const nutrientsMap = useNutrientsByProductIds(productIds);

  return useMemo(() => {
    if (!items.length) return { totals: {}, missingNutrientNames: [] };

    const missingNames: string[] = [];
    for (const item of items) {
      const n = nutrientsMap.get(item.productId);
      if (!n || n.length === 0) {
        const name = item.product?.name ?? item.productId;
        if (!missingNames.includes(name)) missingNames.push(name);
      }
    }

    const totals = calculateDishNutrients(
      items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      nutrientsMap,
    );

    return { totals, missingNutrientNames: missingNames };
  }, [items, nutrientsMap]);
}
