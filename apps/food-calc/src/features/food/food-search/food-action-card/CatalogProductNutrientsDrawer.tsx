import { useMemo } from 'react';
import { useNutrientsByProductIds } from '@/entities/product';
import { calculateProductNutrients, type NutrientTotals } from '@/shared/lib/nutrients';
import { NutrientsDrawer } from '@/widgets/nutrients/NutrientsDrawer';
import type { BaseDrawerProps } from '@/shared/ui';

interface Props extends BaseDrawerProps {
  productId: string;
  productName: string;
}

const PER_100G = 100;

/**
 * Store-driven nutrients drawer for a catalog product. Opened via
 * `drawerStore.show(CatalogProductNutrientsDrawer, props, { side: 'left' })`,
 * so `useNutrientsByProductIds` only runs once the drawer is actually mounted
 * (not eagerly per food-search card).
 */
export function CatalogProductNutrientsDrawer({ onClose, productId, productName }: Props) {
  const productIds = useMemo(() => [productId], [productId]);
  const nutrientsMap = useNutrientsByProductIds(productIds);

  const totals: NutrientTotals = useMemo(() => {
    const entries = nutrientsMap.get(productId);
    if (!entries || entries.length === 0) return {};
    return calculateProductNutrients(entries, PER_100G, '100g');
  }, [productId, nutrientsMap]);

  return <NutrientsDrawer onClose={onClose} totals={totals} viewTitle={productName} />;
}

export default CatalogProductNutrientsDrawer;
