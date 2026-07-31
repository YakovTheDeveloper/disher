import { useMemo, useState } from 'react';
import { useProductWithStatus, useProductPortions, useProductNutrients } from '@/entities/product';
import { NutrientShowcaseDrawer } from '@/features/food/quick-view-drawer';
import { RouterUrls } from '@/shared/config/routes';
import { isCatalogId } from '@/shared/data/catalog';
import type { NutrientTotals } from '@/shared/lib/nutrients';
import type { BaseDrawerProps } from '@/shared/ui';
import { buildQuantityOptions } from './buildQuantityOptions';
import { scaleForBasis } from './scaleForBasis';

interface Props extends BaseDrawerProps {
  productId: string;
  /** Имя для мгновенной шапки, пока продукт грузится из Dexie (опционально). */
  productName?: string;
}

/**
 * Тонкий адаптер быстрого просмотра продукта над `NutrientShowcaseDrawer`.
 * Отдаёт каркасу имя, маршрут страницы, пункты селекта порции и нутриенты, УЖЕ
 * отскейленные под выбранную порцию. Всё редактирование (имя/описание/порции/
 * нутриенты) уехало на `/product/:id` — сюда ведёт кнопка «Открыть страницу»
 * в шапке каркаса; норма — чип-легенда внутри витрины.
 *
 * Открытие: `drawerStore.show(ProductDrawer, { productId, productName }, QUICK_VIEW_DRAWER_OPTIONS)`.
 */
export function ProductDrawer({ productId, productName, onClose }: Props) {
  // `food` — ghost-тик useLiveQuery: имя-«призрак» из productName держит шапку,
  // `loading` гейтит ложное «нет нутриентов» на непустом продукте (симметрия
  // с DishDrawer).
  const { product: food, loading } = useProductWithStatus(productId);
  const portionsRaw = useProductPortions(productId);
  const { results: nutrientsRaw } = useProductNutrients(productId);

  const [selectedPortion, setSelectedPortion] = useState<string | null>(null);

  const isSupplement = food?.servingBasis === 'serving';

  // Пункты селекта только у продукта-еды (basis '100g'). Пункт «Своё значение»
  // (grams:null) отфильтрован: ручной ввод граммов уехал на страницу, а в
  // быстром просмотре под него нет поля — оставляем только grams-опоры.
  const portionOptions = useMemo(
    () =>
      isSupplement
        ? []
        : buildQuantityOptions(
            portionsRaw.map((p) => ({ label: p.label, grams: p.grams }))
          ).filter((o) => o.grams != null),
    [portionsRaw, isSupplement]
  );

  const selectedValue = selectedPortion ?? portionOptions[0]?.value ?? '';
  const selectedGrams =
    portionOptions.find((o) => o.value === selectedValue)?.grams ?? 100;

  // БАД: нутриенты на одну единицу (scale 1). Еда: скейл по граммам выбранной
  // порции. До подгрузки `food` — база на 100 г.
  const scale = food ? scaleForBasis(food.servingBasis, isSupplement ? 1 : selectedGrams) : 1;

  const nutrients = useMemo<NutrientTotals>(() => {
    const map: NutrientTotals = {};
    for (const n of nutrientsRaw) map[n.nutrientId] = n.quantity * scale;
    return map;
  }, [nutrientsRaw, scale]);

  const name = food?.name ?? productName;

  return (
    <NutrientShowcaseDrawer
      title={name ?? 'Продукт'}
      // Подзаголовок именует витрину (имя несёт заголовок) — одинаков для еды.
      subtitle="Пищевая ценность"
      // Каталожные продукты — build-артефакт, read-only: страницы у них нет,
      // кнопку «Открыть страницу» не показываем (только у продуктов юзера/блюд).
      pageRoute={isCatalogId(productId) ? undefined : RouterUrls.getProduct(productId)}
      heroName={name}
      portionOptions={portionOptions}
      selectedPortion={selectedValue}
      onSelectPortion={setSelectedPortion}
      // Супплемент: граммовых опор нет, числа — на порцию. Показываем базис бейджем.
      basisLabel={isSupplement ? 'за порцию' : undefined}
      nutrients={nutrients}
      // Пока строка продукта не подгрузилась — «призрак» шапки + ghost-скелетон
      // вместо витрины (loading-гейт): порция/скейл ещё дефолтные, показывать
      // полу-состояние метра или ложное «нет нутриентов» нельзя.
      hasNutrients={!!food && nutrientsRaw.length > 0}
      loading={loading}
      onClose={onClose}
    />
  );
}

export default ProductDrawer;
