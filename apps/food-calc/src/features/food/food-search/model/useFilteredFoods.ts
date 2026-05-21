import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { useProducts, useNutrientsByProductIds } from '@/entities/product';
import { useDishes } from '@/entities/dish';
import { isCatalogId } from '@/shared/data/catalog';

const FUSE_THRESHOLD = 0.35;
const FUSE_MIN_LEN = 2;

export function useFilteredFoods(
  searchQuery: string,
  richNutrientId?: string | null,
  userOnlyProducts = false,
) {
  const allProductsRaw = useProducts();
  const allDishesRaw = useDishes();

  // pre-filter BEFORE Fuse-index — иначе для нового юзера Fuse вернёт catalog-хиты,
  // которые мы выкинем постфактум и получим пустой список при ненулевом совпадении.
  const productsBase = useMemo(
    () => (userOnlyProducts ? allProductsRaw.filter((p) => !isCatalogId(p.id)) : allProductsRaw),
    [allProductsRaw, userOnlyProducts],
  );

  const productFuse = useMemo(
    () =>
      new Fuse(productsBase, {
        keys: ['name'],
        threshold: FUSE_THRESHOLD,
        ignoreLocation: true,
        includeScore: true,
      }),
    [productsBase]
  );

  const dishFuse = useMemo(
    () =>
      new Fuse(allDishesRaw, {
        keys: ['name'],
        threshold: FUSE_THRESHOLD,
        ignoreLocation: true,
        includeScore: true,
      }),
    [allDishesRaw]
  );

  const allProducts = useMemo(() => {
    const q = searchQuery.trim();
    if (q.length < FUSE_MIN_LEN) return productsBase;
    return productFuse.search(q).map((r) => r.item);
  }, [searchQuery, productsBase, productFuse]);

  const dishes = useMemo(() => {
    const q = searchQuery.trim();
    if (q.length < FUSE_MIN_LEN) return allDishesRaw;
    return dishFuse.search(q).map((r) => r.item);
  }, [searchQuery, allDishesRaw, dishFuse]);

  const productIds = useMemo(() => allProducts.map((p) => p.id), [allProducts]);
  const nutrientMap = useNutrientsByProductIds(richNutrientId ? productIds : []);

  const products = useMemo(() => {
    if (!richNutrientId || nutrientMap.size === 0) return allProducts;
    return [...allProducts].sort((a, b) => {
      const aVal =
        nutrientMap.get(a.id)?.find((n) => n.nutrientId === richNutrientId)?.quantity ?? 0;
      const bVal =
        nutrientMap.get(b.id)?.find((n) => n.nutrientId === richNutrientId)?.quantity ?? 0;
      return bVal - aVal;
    });
  }, [allProducts, richNutrientId, nutrientMap]);

  return { products, dishes, nutrientMap };
}
