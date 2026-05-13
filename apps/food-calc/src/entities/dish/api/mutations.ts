import {
  db,
  type DishRow,
  type DishItemRow,
  type DishPortionRow,
  type ScheduleFoodRow,
} from '@/shared/lib/dexie/schema';

const now = () => new Date().toISOString();

export async function createDish(name: string): Promise<string> {
  const id = crypto.randomUUID();
  const row: DishRow = { id, name, created_at: now() };
  await db.dishes.add(row);
  return id;
}

export async function updateDishName(dishId: string, name: string): Promise<void> {
  await db.dishes.update(dishId, { name });
}

export async function deleteDish(
  dishId: string,
  itemIds: string[],
  portionIds: string[],
): Promise<void> {
  await db.transaction(
    'rw',
    [db.dishes, db.dish_items, db.dish_portions],
    async () => {
      if (itemIds.length) await db.dish_items.bulkDelete(itemIds);
      if (portionIds.length) await db.dish_portions.bulkDelete(portionIds);
      await db.dishes.delete(dishId);
    },
  );
}

export async function deleteDishes(
  dishes: Array<{ id: string; itemIds: string[]; portionIds: string[] }>,
): Promise<void> {
  if (dishes.length === 0) return;
  await db.transaction(
    'rw',
    [db.dishes, db.dish_items, db.dish_portions],
    async () => {
      for (const d of dishes) {
        if (d.itemIds.length) await db.dish_items.bulkDelete(d.itemIds);
        if (d.portionIds.length) await db.dish_portions.bulkDelete(d.portionIds);
        await db.dishes.delete(d.id);
      }
    },
  );
}

export async function addDishItem(params: {
  dishId: string;
  productId: string;
  quantity: number;
  details?: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  const row: DishItemRow = {
    id,
    dish_id: params.dishId,
    product_id: params.productId,
    quantity: params.quantity,
    details: params.details ?? '',
    created_at: now(),
  };
  await db.dish_items.add(row);
  return id;
}

type DishItemUpdates = Partial<{ quantity: number; productId: string; details: string }>;

const DISH_ITEM_COLUMN_MAP: Record<keyof DishItemUpdates, string> = {
  quantity: 'quantity',
  productId: 'product_id',
  details: 'details',
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
}

export async function removeDishItem(itemId: string): Promise<void> {
  await db.dish_items.delete(itemId);
}

export async function copyDishItems(
  items: Array<{ productId: string; quantity: number; details?: string }>,
  toDishId: string,
): Promise<void> {
  if (items.length === 0) return;
  const stamped = now();
  const rows: DishItemRow[] = items.map((item) => ({
    id: crypto.randomUUID(),
    dish_id: toDishId,
    product_id: item.productId,
    quantity: item.quantity,
    details: item.details ?? '',
    created_at: stamped,
  }));
  await db.dish_items.bulkAdd(rows);
}

export async function addDishPortion(
  dishId: string,
  portion: { label: string; grams: number },
): Promise<void> {
  const row: DishPortionRow = {
    id: crypto.randomUUID(),
    dish_id: dishId,
    label: portion.label,
    grams: portion.grams,
    created_at: now(),
  };
  await db.dish_portions.add(row);
}

type DishPortionUpdates = Partial<{
  label: string;
  grams: number;
}>;

export async function updateDishPortion(
  portionId: string,
  updates: DishPortionUpdates,
): Promise<void> {
  const keys = Object.keys(updates) as (keyof DishPortionUpdates)[];
  if (keys.length === 0) return;
  await db.dish_portions.update(portionId, updates as Record<string, unknown>);
}

export async function removeDishPortion(portionId: string): Promise<void> {
  await db.dish_portions.delete(portionId);
}

export async function dishItemsToScheduleFoods(
  items: Array<{ productId: string; quantity: number }>,
  date: string,
  time: string,
): Promise<void> {
  if (items.length === 0) return;
  const stamped = now();
  const rows: ScheduleFoodRow[] = items.map((item) => ({
    id: crypto.randomUUID(),
    date,
    time,
    type: 'food',
    quantity: item.quantity,
    details: '',
    product_id: item.productId,
    dish_id: null,
    created_at: stamped,
  }));
  await db.schedule_foods.bulkAdd(rows);
}
