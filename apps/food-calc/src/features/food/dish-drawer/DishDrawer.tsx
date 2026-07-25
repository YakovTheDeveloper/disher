import { useMemo, useState } from 'react';
import {
  useDishWithStatus,
  useDishItemsWithProducts,
  useDishNutrientTotals,
  useDishPortions,
} from '@/entities/dish';
import { NutrientShowcaseDrawer } from '@/features/food/quick-view-drawer';
import { RouterUrls } from '@/shared/config/routes';
import type { SelectOption } from '@/shared/ui/atoms/Select';
import type { NutrientTotals } from '@/shared/lib/nutrients';
import type { BaseDrawerProps } from '@/shared/ui';

interface Props extends BaseDrawerProps {
  dishId: string;
  /** Имя для мгновенной шапки, пока блюдо грузится из Dexie (опционально). */
  dishName?: string;
}

// Производная строка «всё блюдо» (сумма ингредиентов) — value селекта. Зеркалит
// implicitPortion страницы блюда (DishBuilderPage), где тем же label резервируется
// имя, чтобы юзер не создал порцию-двойник; здесь тот же label = якорь дефолта.
const WHOLE_DISH = 'Всё блюдо';

/**
 * Тонкий адаптер блюда над общим `NutrientShowcaseDrawer`: быстрый нижний
 * просмотр нутриентов с выбором порции. Редактирование (состав/имя/порции)
 * живёт на странице `/dish/:id` — туда ведёт кнопка «Открыть страницу» в шапке
 * самого каркаса.
 *
 * Селект порции — «Всё блюдо» (вся сумма ингредиентов) + каждая dish_portion;
 * суммарные `totals` (весь вес блюда) скейлятся `grams / totalWeight` под выбор.
 *
 * Открытие: `drawerStore.show(DishDrawer, { dishId, dishName }, QUICK_VIEW_DRAWER_OPTIONS)`.
 */
export function DishDrawer({ dishId, dishName, onClose }: Props) {
  const { dish, loading } = useDishWithStatus(dishId);
  const items = useDishItemsWithProducts(dishId);
  const { totals } = useDishNutrientTotals(dishId);
  const portions = useDishPortions(dishId);
  const [selectedPortion, setSelectedPortion] = useState(WHOLE_DISH);

  const heroName = dish?.name ?? dishName;
  // Вес всего блюда = сумма количеств ингредиентов — тот же расчёт, что задаёт
  // implicitPortion.grams на странице блюда (DishBuilderPage), не свой.
  const totalWeight = useMemo(
    () => items.reduce((sum, it) => sum + it.quantity, 0),
    [items],
  );

  // Пустое блюдо → ни порций, ни меры: у него totals = {}, а «Всё блюдо» из нулей
  // читалось бы как заполненный профиль. Каркас покажет подсказку.
  const hasNutrients = items.length > 0;

  const portionOptions: SelectOption[] = useMemo(
    () =>
      hasNutrients
        ? [
            { value: WHOLE_DISH, label: WHOLE_DISH },
            ...portions.map((p) => ({ value: p.label, label: p.label })),
          ]
        : [],
    [hasNutrients, portions],
  );

  const nutrients = useMemo<NutrientTotals>(() => {
    const grams =
      selectedPortion === WHOLE_DISH
        ? totalWeight
        : (portions.find((p) => p.label === selectedPortion)?.grams ?? totalWeight);
    const scale = totalWeight > 0 ? grams / totalWeight : 0;
    if (scale === 1) return totals;
    const scaled: NutrientTotals = {};
    for (const [id, value] of Object.entries(totals)) scaled[id] = value * scale;
    return scaled;
  }, [selectedPortion, totalWeight, portions, totals]);

  return (
    <NutrientShowcaseDrawer
      title={heroName ?? 'Блюдо'}
      subtitle="Пищевая ценность"
      pageRoute={RouterUrls.getDish(dishId)}
      heroName={heroName}
      portionOptions={portionOptions}
      selectedPortion={selectedPortion}
      onSelectPortion={setSelectedPortion}
      nutrients={nutrients}
      hasNutrients={hasNutrients}
      // Ghost-гейт: пока строка блюда грузится из Dexie, не мигаем подсказкой
      // «нет нутриентов» на непустом блюде (симметрия с ProductDrawer `!!food`).
      loading={loading}
      onClose={onClose}
    />
  );
}

export default DishDrawer;
