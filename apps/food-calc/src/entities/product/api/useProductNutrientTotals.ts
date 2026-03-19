import { useMemo } from 'react';
import { useProductNutrients } from './queries';
import { calculateProductNutrients, type NutrientTotals } from '@/shared/lib/nutrients';

export function useProductNutrientTotals(
  productId: string | undefined,
  quantity: number,
): NutrientTotals {
  const { results: nutrients } = useProductNutrients(productId);

  return useMemo(() => {
    if (!nutrients) return {};
    const entries = nutrients.map((n) => ({
      nutrientId: n.nutrientId,
      quantity: n.quantity,
    }));
    return calculateProductNutrients(entries, quantity);
  }, [nutrients, quantity]);
}
