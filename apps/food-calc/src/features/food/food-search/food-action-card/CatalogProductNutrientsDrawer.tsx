import { useMemo } from 'react';
import { SideDrawer } from '@/shared/ui';
import { useNutrientsByProductIds } from '@/entities/product';
import { calculateProductNutrients, type NutrientTotals } from '@/shared/lib/nutrients';
import { useNutrientNormSlots } from '@/features/dailyNorms/NutrientNormDrawerControl';
import { FoodsNutrients } from '@/widgets/nutrients/FoodsNutrients';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
};

const PER_100G = 100;

export function CatalogProductNutrientsDrawer({
  open,
  onOpenChange,
  productId,
  productName,
}: Props) {
  const productIds = useMemo(() => [productId], [productId]);
  const nutrientsMap = useNutrientsByProductIds(productIds);

  const totals: NutrientTotals = useMemo(() => {
    const entries = nutrientsMap.get(productId);
    if (!entries || entries.length === 0) return {};
    return calculateProductNutrients(entries, PER_100G, '100g');
  }, [productId, nutrientsMap]);

  const slots = useNutrientNormSlots({ isOpen: open });
  const title = slots.bodyContent == null ? productName : slots.title;

  return (
    <SideDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      headerAction={slots.headerAction}
    >
      {slots.bodyContent ?? (
        <>
          {slots.devToggle}
          {slots.emptyStateBanner}
          <FoodsNutrients totals={totals} />
        </>
      )}
    </SideDrawer>
  );
}

export default CatalogProductNutrientsDrawer;
