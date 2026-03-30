import { useCallback } from 'react';
import { useStore } from '@livestore/react';
import { createProduct } from '@/entities/product';
import { createDish } from '@/entities/dish';
import { getProductUrl, RouterUrls } from '@/app/router';
import toaster from '@/shared/lib/toaster/toaster';
import { safeMutate } from '@/shared/lib/safeMutate';

export function useFoodCreation(
  searchQuery: string,
  setSearchQuery: (q: string) => void,
) {
  const { store } = useStore();

  const handleCreateProduct = useCallback(() => {
    const name = searchQuery.trim();
    if (!name) return;
    const productId = safeMutate(() => createProduct(store, { name }), 'Не удалось создать продукт');
    if (productId === undefined) return;
    setSearchQuery('');
    toaster.success(`Продукт «${name}» создан`, {
      action: { label: 'Открыть', href: getProductUrl(productId) },
    });
  }, [searchQuery, setSearchQuery, store]);

  const handleCreateDish = useCallback(() => {
    const name = searchQuery.trim();
    if (!name) return;
    const dishId = safeMutate(() => createDish(store, name), 'Не удалось создать блюдо');
    if (dishId === undefined) return;
    setSearchQuery('');
    toaster.success(`Блюдо «${name}» создано`, {
      action: { label: 'Открыть', href: RouterUrls.getDish(dishId) },
    });
  }, [searchQuery, setSearchQuery, store]);

  return { handleCreateProduct, handleCreateDish };
}
