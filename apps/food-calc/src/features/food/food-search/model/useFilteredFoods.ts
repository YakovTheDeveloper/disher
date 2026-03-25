import { useMemo } from 'react';
import { useProducts } from '@/entities/product';
import { useDishes } from '@/entities/dish';
import { useCategoryFilterState } from '@/features/shared/hooks/useCategoryFilterState';
import { computeDishDietaryCategories } from '@/shared/lib/dishCategories';
import { isCreatedByUser } from '@/shared/lib';

export function useFilteredFoods(searchQuery: string, myFoodOnly = false) {
  const { results: productsMap, fetching: productsFetching } = useProducts(
    searchQuery || undefined,
  );
  const { results: dishesMap, fetching: dishesFetching } = useDishes(
    searchQuery || undefined,
  );

  const allProducts = useMemo(
    () => (productsMap ? Array.from(productsMap.values()) : []),
    [productsMap],
  );
  const allDishes = useMemo(
    () => (dishesMap ? Array.from(dishesMap.values()) : []),
    [dishesMap],
  );

  const productsById = useMemo(
    () => new Map(allProducts.map((p) => [p.id, p])),
    [allProducts],
  );

  const categoryFilter = useCategoryFilterState();

  // Product filtering — OR logic: show if product has ANY selected category
  const selectedProductCategories = categoryFilter.getCategoryFilter('product');
  const products = useMemo(() => {
    let filtered = allProducts;
    if (myFoodOnly) {
      filtered = filtered.filter((p) => isCreatedByUser(p.userId));
    }
    if (selectedProductCategories.length > 0) {
      filtered = filtered.filter((p) => {
        if (!p.categories) return false;
        return selectedProductCategories.some((cat) => p.categories!.has(cat));
      });
    }
    return filtered;
  }, [allProducts, selectedProductCategories, myFoodOnly]);

  // Dish filtering — AND logic: show if dish satisfies ALL selected dietary categories
  const selectedDishCategories = categoryFilter.getCategoryFilter('dish');
  const dishes = useMemo(() => {
    if (selectedDishCategories.length === 0) return allDishes;
    return allDishes.filter((dish) => {
      const computed = computeDishDietaryCategories(dish, productsById);
      return selectedDishCategories.every((cat) => computed.has(cat as never));
    });
  }, [allDishes, selectedDishCategories, productsById]);

  const isLoading = productsFetching || dishesFetching;

  return { products, dishes, categoryFilter, isLoading };
}
