import { useMemo, useState, useCallback } from 'react';
import { useProducts, useNutrientsByProductIds } from '@/entities/product';
import { useDishes, useDishItemsByDishIds } from '@/entities/dish';
import { isCreatedByUser, parseCategories } from '@/shared/lib';

export function useFilteredFoods(searchQuery: string, myFoodOnly = false, richNutrientId?: string | null) {
  const allProducts = useProducts(
    searchQuery || undefined,
  );
  const allDishes = useDishes(
    searchQuery || undefined,
  );

  // Single unified category filter (product categories apply to both products and dishes)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  }, []);

  const clearCategories = useCallback(() => {
    setSelectedCategories([]);
  }, []);

  // Load nutrients for all products when richNutrient sorting is active
  const productIds = useMemo(() => allProducts.map((p) => p.id), [allProducts]);
  const nutrientMap = useNutrientsByProductIds(richNutrientId ? productIds : []);

  // Product filtering — OR logic: show if product has ANY selected category
  const products = useMemo(() => {
    let filtered = allProducts;
    if (myFoodOnly) {
      filtered = filtered.filter((p) => isCreatedByUser(p.userId));
    }
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) => {
        const parsed = parseCategories(p.categories);
        return selectedCategories.some((cat) => parsed.includes(cat));
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
  }, [allProducts, selectedCategories, myFoodOnly, richNutrientId, nutrientMap]);

  // Dish filtering — OR logic: show if ANY ingredient product has ANY selected category
  const dishIds = useMemo(() => allDishes.map((d) => d.id), [allDishes]);
  const allDishItems = useDishItemsByDishIds(dishIds);
  const allProductsForLookup = useProducts();

  const productsById = useMemo(
    () => new Map(allProductsForLookup.map((p) => [p.id, p])),
    [allProductsForLookup],
  );

  const dishes = useMemo(() => {
    let filtered = allDishes;
    if (myFoodOnly) {
      filtered = filtered.filter((d) => isCreatedByUser(d.userId));
    }
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((dish) => {
        const items = allDishItems.filter((di) => di.dishId === dish.id);
        return items.some((item) => {
          const product = productsById.get(item.productId);
          if (!product) return false;
          const parsed = parseCategories(product.categories);
          return selectedCategories.some((cat) => parsed.includes(cat));
        });
      });
    }
    return filtered;
  }, [allDishes, selectedCategories, myFoodOnly, allDishItems, productsById]);

  const categoryFilter = useMemo(() => ({
    selectedCategories,
    toggleCategory,
    clearCategories,
  }), [selectedCategories, toggleCategory, clearCategories]);

  return { products, dishes, categoryFilter, nutrientMap };
}
