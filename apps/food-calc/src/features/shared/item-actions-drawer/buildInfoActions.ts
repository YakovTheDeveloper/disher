import type { NavigateFunction } from 'react-router-dom';
import type { ItemAction } from './ItemActionsDrawer';
import { RouterUrls } from '@/shared/config/routes';
import { pushNavigate } from '@/shared/lib/viewTransition';
import { isCatalogId } from '@/shared/data/catalog';

type InfoItem = {
  type: string;
  productId?: string | null;
  dishId?: string | null;
};

/**
 * «Информация о продукте/блюде» action for the per-item drawer — present ONLY
 * when the row points at a real entity. An orphan / unresolved row (no
 * productId and no dishId) returns an empty list, so the drawer shows delete
 * only and we never navigate for a null entity. Каталожный продукт страницы
 * НЕ имеет (build-route, read-only) → тоже пустой список, кнопки ↗ в хедере
 * не будет (та же гейта, что `pageRoute` в ProductDrawer).
 *
 * Both product and dish navigate to the full entity page (`/product/:id`,
 * `/dish/:id`) — this is the deep «Информация» affordance. The quick-peek bottom
 * drawer is a separate, shallower path, reached ONLY from the SearchFood card
 * ⓘ button (the two intentionally diverge: ⓘ = peek, long-press «Информация» =
 * page).
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
  if (item.type === 'food' && item.productId && !isCatalogId(item.productId)) {
    const productId = item.productId;
    return [
      {
        label: 'Информация о продукте',
        onClick: () => pushNavigate(navigate, RouterUrls.getProduct(productId), 'push'),
      },
    ];
  }
  return [];
}
