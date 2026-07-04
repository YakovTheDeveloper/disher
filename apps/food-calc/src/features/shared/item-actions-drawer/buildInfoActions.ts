import type { ItemAction } from './ItemActionsDrawer';
import { drawerStore } from '@/shared/ui/drawer-store';
// Конкретные файлы, не barrel — иначе цикл с этим же модулем (см. ProductDrawer).
import { ProductDrawer } from '@/features/food/product-drawer/ProductDrawer';
import { DishDrawer } from '@/features/food/dish-drawer/DishDrawer';

type InfoItem = {
  type: string;
  productId?: string | null;
  dishId?: string | null;
};

/**
 * «Информация о продукте/блюде» action for the per-item drawer — present ONLY
 * when the row points at a real entity. An orphan / unresolved row (no
 * productId and no dishId) returns an empty list, so the drawer shows delete
 * only and we never open a drawer for a null entity.
 *
 * Both product and dish open a side drawer (ProductDrawer / DishDrawer) instead
 * of navigating to a page — the overlay preserves the caller's scroll/modal
 * state. The dish drawer's own top-right arrow goes to the full `/dish/:id` page.
 *
 * Shared by FoodSchedule (food/dish rows) and DishBuilder (ingredient rows,
 * which are always products → pass `{ type: 'food', productId }`).
 */
export function buildInfoActions(item: InfoItem): ItemAction[] {
  if (item.type === 'dish' && item.dishId) {
    const dishId = item.dishId;
    return [
      {
        label: 'Информация о блюде',
        // Единственное навигационное действие стека = его акцент (уголь-filled).
        variant: 'system',
        // Блюдо открывается боковым DishDrawer (read-only превью; стрелка в его
        // шапке ведёт на страницу /dish/:id).
        onClick: () =>
          drawerStore.show(
            DishDrawer,
            { dishId },
            { side: 'left', width: 'min(85vw, 360px)' },
          ),
      },
    ];
  }
  if (item.type === 'food' && item.productId) {
    const productId = item.productId;
    return [
      {
        label: 'Информация о продукте',
        // Единственное навигационное действие стека = его акцент (уголь-filled).
        variant: 'system',
        // Продукт открывается боковым ProductDrawer (страница /product/:id
        // инактивирована). Имя для шапки подъедет из useProduct внутри дровера.
        onClick: () =>
          drawerStore.show(
            ProductDrawer,
            { productId },
            { side: 'left', width: 'min(85vw, 360px)' },
          ),
      },
    ];
  }
  return [];
}
