import type { NavigateFunction } from 'react-router';
import type { ItemAction } from './ItemActionsDrawer';
import { getProductUrl, RouterUrls } from '@/app/router';
import { pushNavigate } from '@/shared/lib/viewTransition';

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
        onClick: () => pushNavigate(navigate, RouterUrls.getDish(dishId), 'push'),
      },
    ];
  }
  if (item.type === 'food' && item.productId) {
    const productId = item.productId;
    return [
      {
        label: 'Информация о продукте',
        onClick: () => pushNavigate(navigate, getProductUrl(productId), 'push'),
      },
    ];
  }
  return [];
}
