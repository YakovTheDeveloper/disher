import type { NavigateFunction } from 'react-router';
import type { ItemAction } from './ItemActionsDrawer';
import { RouterUrls } from '@/app/router';
import { pushNavigate } from '@/shared/lib/viewTransition';
import { drawerStore } from '@/shared/ui/drawer-store';
// Конкретный файл, не barrel — иначе цикл с этим же модулем (см. ProductDrawer).
import { ProductDrawer } from '@/features/food/product-drawer/ProductDrawer';

type InfoItem = {
  type: string;
  productId?: string | null;
  dishId?: string | null;
};

/**
 * «Информация о продукте/блюде» action for the per-item drawer — present ONLY
 * when the row points at a real entity. An orphan / unresolved row (no
 * productId and no dishId) returns an empty list, so the drawer shows delete
 * only and we never navigate to `/product/null`.
 *
 * Shared by FoodSchedule (food/dish rows) and DishBuilder (ingredient rows,
 * which are always products → pass `{ type: 'food', productId }`).
 */
export function buildInfoActions(item: InfoItem, navigate: NavigateFunction): ItemAction[] {
  if (item.type === 'dish' && item.dishId) {
    const dishId = item.dishId;
    return [
      {
        label: 'Информация о блюде',
        // Единственное навигационное действие стека = его акцент (уголь-filled).
        // 'system', не амбра/`primary` — это навигация, не бизнес-CTA.
        variant: 'system',
        onClick: () => pushNavigate(navigate, RouterUrls.getDish(dishId), 'push'),
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
