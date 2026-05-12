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
    const result = await safeMutate(() => createProduct({ name }), 'Не удалось создать продукт');
    if (!result.ok) return;
    setSearchQuery('');
    toaster.success(`Продукт «${name}» создан`, {
      action: { label: 'Открыть', href: getProductUrl(result.value) },
    });
  }, [searchQuery, setSearchQuery]);

  const handleCreateDish = useCallback(async () => {
    const name = searchQuery.trim();
    if (!name) return;
    const result = await safeMutate(() => createDish(name), 'Не удалось создать блюдо');
    if (!result.ok) return;
    setSearchQuery('');
    toaster.success(`Блюдо «${name}» создано`, {
      action: { label: 'Открыть', href: RouterUrls.getDish(result.value) },
    });
  }, [searchQuery, setSearchQuery]);

  return { handleCreateProduct, handleCreateDish };
}
