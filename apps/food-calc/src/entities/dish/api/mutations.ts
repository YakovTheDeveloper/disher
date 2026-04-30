import {
  db,
  type DishRow,
  type DishItemRow,
  type DishPortionRow,
  type ScheduleFoodRow,
} from '@/shared/lib/dexie/schema';
import { getUserIdSync } from '@/shared/lib/auth/useUserId';
import { scheduleCold, scheduleHot } from '@/shared/lib/sync/scheduler';

function requireUserId(): string {
  const userId = getUserIdSync();
  if (!userId) throw new Error('Not authenticated');
  return userId;
}

export async function createDish(name: string): Promise<string> {
  const id = crypto.randomUUID();
  const userId = requireUserId();
  await db.dishes.add({
    id,
    user_id: userId,
    name,
  } as unknown as DishRow);
  scheduleCold();
  return id;
}

export async function updateDishName(dishId: string, name: string): Promise<void> {
  await db.dishes.update(dishId, { name });
  scheduleCold();
}

export async function deleteDish(
  dishId: string,
  itemIds: string[],
  portionIds: string[],
): Promise<void> {
  const now = new Date().toISOString();
  await db.transaction(
    'rw',
    [db.dishes, db.dish_items, db.dish_portions],
    async () => {
      for (const id of itemIds) {
        await db.dish_items.update(id, { deleted_at: now });
      }
      for (const id of portionIds) {
        await db.dish_portions.update(id, { deleted_at: now });
      }
      await db.dishes.update(dishId, { deleted_at: now });
    },
  );
  scheduleCold();
}

export async function deleteDishes(
  dishes: Array<{ id: string; itemIds: string[]; portionIds: string[] }>,
): Promise<void> {
  if (dishes.length === 0) return;
  const now = new Date().toISOString();
  await db.transaction(
    'rw',
    [db.dishes, db.dish_items, db.dish_portions],
    async () => {
      for (const d of dishes) {
        for (const id of d.itemIds) {
          await db.dish_items.update(id, { deleted_at: now });
        }
        for (const id of d.portionIds) {
          await db.dish_portions.update(id, { deleted_at: now });
        }
        await db.dishes.update(d.id, { deleted_at: now });
      }
    },
  );
  scheduleCold();
}

export async function addDishItem(params: {
  dishId: string;
  productId: string;
  quantity: number;
}): Promise<string> {
  const id = crypto.randomUUID();
  const userId = requireUserId();
  await db.dish_items.add({
    id,
    user_id: userId,
    dish_id: params.dishId,
    product_id: params.productId,
    quantity: params.quantity,
  } as unknown as DishItemRow);
  scheduleCold();
  return id;
}

type DishItemUpdates = Partial<{ quantity: number; productId: string }>;

const DISH_ITEM_COLUMN_MAP: Record<keyof DishItemUpdates, string> = {
  quantity: 'quantity',
  productId: 'product_id',
};

export async function updateDishItem(
  itemId: string,
  updates: DishItemUpdates,
): Promise<void> {
  const keys = Object.keys(updates) as (keyof DishItemUpdates)[];
  if (keys.length === 0) return;
  const patch: Record<string, unknown> = {};
  for (const k of keys) {
    patch[DISH_ITEM_COLUMN_MAP[k]] = updates[k];
  }
  await db.dish_items.update(itemId, patch);
  scheduleCold();
}

export async function removeDishItem(itemId: string): Promise<void> {
  await db.dish_items.update(itemId, { deleted_at: new Date().toISOString() });
  scheduleCold();
}

export async function copyDishItems(
  items: Array<{ productId: string; quantity: number }>,
  toDishId: string,
): Promise<void> {
  if (items.length === 0) return;
  const userId = requireUserId();
  await db.transaction('rw', db.dish_items, async () => {
    for (const item of items) {
      await db.dish_items.add({
        id: crypto.randomUUID(),
        user_id: userId,
        dish_id: toDishId,
        product_id: item.productId,
        quantity: item.quantity,
      } as unknown as DishItemRow);
    }
  });
  scheduleCold();
}

export async function addDishPortion(
  dishId: string,
  portion: { label: string; amount: number; unit: string; grams: number },
): Promise<void> {
  const id = crypto.randomUUID();
  const userId = requireUserId();
  await db.dish_portions.add({
    id,
    user_id: userId,
    dish_id: dishId,
    label: portion.label,
    amount: portion.amount,
    unit: portion.unit,
    grams: portion.grams,
  } as unknown as DishPortionRow);
  scheduleCold();
}

type DishPortionUpdates = Partial<{
  label: string;
  amount: number;
  unit: string;
  grams: number;
}>;

export async function updateDishPortion(
  portionId: string,
  updates: DishPortionUpdates,
): Promise<void> {
  const keys = Object.keys(updates) as (keyof DishPortionUpdates)[];
  if (keys.length === 0) return;
  await db.dish_portions.update(portionId, updates as Record<string, unknown>);
  scheduleCold();
}

export async function removeDishPortion(portionId: string): Promise<void> {
  await db.dish_portions.update(portionId, {
    deleted_at: new Date().toISOString(),
  });
  scheduleCold();
}

export async function dishItemsToScheduleFoods(
  items: Array<{ productId: string; quantity: number }>,
  date: string,
  time: string,
): Promise<void> {
  if (items.length === 0) return;
  const userId = requireUserId();
  await db.transaction('rw', db.schedule_foods, async () => {
    for (const item of items) {
      await db.schedule_foods.add({
        id: crypto.randomUUID(),
        user_id: userId,
        date,
        time,
        type: 'food',
        quantity: item.quantity,
        details: '',
        product_id: item.productId,
        dish_id: null,
      } as unknown as ScheduleFoodRow);
    }
  });
  scheduleHot();
}
