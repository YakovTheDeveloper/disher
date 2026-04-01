import { useMemo } from 'react';
import { useProducts, useNutrientsByProductIds } from '@/entities/product';
import { useDishes } from '@/entities/dish';
import { useCategoryFilterState } from '@/features/shared/hooks/useCategoryFilterState';
import { computeDishDietaryCategories } from '@/shared/lib/dishCategories';
import { isCreatedByUser, parseCategories } from '@/shared/lib';

export function useFilteredFoods(searchQuery: string, myFoodOnly = false, richNutrientId?: string | null) {
  const allProducts = useProducts(
    searchQuery || undefined,
  );
  const allDishes = useDishes(
    searchQuery || undefined,
  );

  const productsById = useMemo(
    () => new Map(allProducts.map((p) => [p.id, p])),
    [allProducts],
  );

  const categoryFilter = useCategoryFilterState();

  // Load nutrients for all products when richNutrient sorting is active
  const productIds = useMemo(() => allProducts.map((p) => p.id), [allProducts]);
  const nutrientMap = useNutrientsByProductIds(richNutrientId ? productIds : []);

  // Product filtering — OR logic: show if product has ANY selected category
  const selectedProductCategories = categoryFilter.getCategoryFilter('product');
  const products = useMemo(() => {
    let filtered = allProducts;
    if (myFoodOnly) {
      filtered = filtered.filter((p) => isCreatedByUser(p.userId));
    }
    if (selectedProductCategories.length > 0) {
      filtered = filtered.filter((p) => {
        const parsed = parseCategories(p.categories);
        return selectedProductCategories.some((cat) => parsed.includes(cat));
      });
    }
    // Sort by richNutrient content (descending)
    if (richNutrientId && nutrientMap.size > 0) {
      filtered = [...filtered].sort((a, b) => {
        const aNutrients = nutrientMap.get(a.id);
        const bNutrients = nutrientMap.get(b.id);
        const aVal = aNutrients?.find((n) => n.nutrientId === richNutrientId)?.quantity ?? 0;
        const bVal = bNutrients?.find((n) => n.nutrientId === richNutrientId)?.quantity ?? 0;
        return bVal - aVal;
      });
    }
    return filtered;
  }, [allProducts, selectedProductCategories, myFoodOnly, richNutrientId, nutrientMap]);

  // Dish filtering — AND logic: show if dish satisfies ALL selected dietary categories
  const selectedDishCategories = categoryFilter.getCategoryFilter('dish');
  const dishes = useMemo(() => {
    if (selectedDishCategories.length === 0) return allDishes;
    return allDishes.filter((dish) => {
      const computed = computeDishDietaryCategories(dish as any, productsById as any);
      return selectedDishCategories.every((cat) => computed.has(cat as never));
    });
  }, [allDishes, selectedDishCategories, productsById]);

  return { products, dishes, categoryFilter, nutrientMap };
}
