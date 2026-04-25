import { useCallback } from 'react';
import { createProduct } from '@/entities/product';
import { createDish } from '@/entities/dish';
import { getProductUrl, RouterUrls } from '@/app/router';
import toaster from '@/shared/lib/toaster/toaster';
import { safeMutate } from '@/shared/lib/safeMutate';

export function useFoodCreation(
  searchQuery: string,
  setSearchQuery: (q: string) => void,
) {
  const handleCreateProduct = useCallback(async () => {
    const name = searchQuery.trim();
    if (!name) return;
    const productId = await safeMutate(() => createProduct({ name }), 'Не удалось создать продукт');
    if (productId === undefined) return;
    setSearchQuery('');
    toaster.success(`Продукт «${name}» создан`, {
      action: { label: 'Открыть', href: getProductUrl(productId) },
    });
  }, [searchQuery, setSearchQuery]);

  const handleCreateDish = useCallback(async () => {
    const name = searchQuery.trim();
    if (!name) return;
    const dishId = await safeMutate(() => createDish(name), 'Не удалось создать блюдо');
    if (dishId === undefined) return;
    setSearchQuery('');
    toaster.success(`Блюдо «${name}» создано`, {
      action: { label: 'Открыть', href: RouterUrls.getDish(dishId) },
    });
  }, [searchQuery, setSearchQuery]);

  return { handleCreateProduct, handleCreateDish };
}
