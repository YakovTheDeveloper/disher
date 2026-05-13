import { useMemo } from 'react';
import { useProduct } from '@/entities/product';
import { useCustomTagsByProduct } from '@/entities/custom-tag';
import { getSuggestionsForProduct } from '@/shared/data/tag-suggestions';

function readCategories(product: { categories: string } | null): readonly string[] {
  if (!product) return [];
  try {
    const parsed = JSON.parse(product.categories);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

// Whether the details-step should be part of the main flow for this product.
// True when there is at least one chip the user could tap — either a curated
// suggestion for the product's categories, or a previously-saved custom tag.
// Used by ScheduleFoodCreateModals to flip the quantity-step CTA between
// "Next → details" and "Готово (commit)".
export function useHasDetailsHints(productId: string | null | undefined): boolean {
  const product = useProduct(productId ?? undefined);
  const customs = useCustomTagsByProduct(productId);
  return useMemo(() => {
    const categories = readCategories(product);
    if (getSuggestionsForProduct(categories).length > 0) return true;
    return customs.length > 0;
  }, [product, customs]);
}
