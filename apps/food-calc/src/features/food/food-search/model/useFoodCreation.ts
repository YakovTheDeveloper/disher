import { useCallback } from 'react';
import { createProduct } from '@/entities/product';
import { createDish } from '@/entities/dish';
import { getProductUrl, RouterUrls } from '@/app/router';
import toaster from '@/shared/lib/toaster/toaster';

export function useFoodCreation(
  searchQuery: string,
  setSearchQuery: (q: string) => void,
) {
  const handleCreateProduct = useCallback(async () => {
    const name = searchQuery.trim();
    if (!name) return;
    const productId = await createProduct({ name });
    setSearchQuery('');
    toaster.success(`Продукт «${name}» создан`, {
      action: { label: 'Открыть', href: getProductUrl(productId) },
    });
  }, [searchQuery, setSearchQuery]);

  const handleCreateDish = useCallback(async () => {
    const name = searchQuery.trim();
    if (!name) return;
    const dishId = await createDish(name);
    setSearchQuery('');
    toaster.success(`Блюдо «${name}» создано`, {
      action: { label: 'Открыть', href: RouterUrls.getDish(dishId) },
    });
  }, [searchQuery, setSearchQuery]);

  return { handleCreateProduct, handleCreateDish };
}
