import {
  db,
  type DishRow,
  type DishItemRow,
  type DishPortionRow,
} from '@/shared/lib/dexie/schema';
import {
  putRow,
  updateRow,
  deleteRow,
  deleteRows,
} from '@/shared/lib/dexie/write';

const now = () => new Date().toISOString();

export async function createDish(name: string, id?: string): Promise<string> {
  // Contract guard: a dish must always have a non-empty name. UI create flows
  // already trim+guard, but enforcing it here makes the invariant structural —
  // a nameless dish would silently break name-driven features (e.g. the
  // «Предложить ингредиенты» head-A button no-ops on an empty name).
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Название блюда не может быть пустым');
  const dishId = id ?? crypto.randomUUID();
  const row: Omit<DishRow, 'updated_at'> = { id: dishId, name: trimmed, created_at: now() };
  await putRow(db.dishes, row);
  return dishId;
}

export async function updateDishName(dishId: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Название блюда не может быть пустым');
  await updateRow(db.dishes, dishId, { name: trimmed });
}

// Resolve a dish's full delete cascade — its dish_items + dish_portions
// (queried by dish_id, NOT trusted from the caller) plus the dish row itself.
// The live caller used to pass empty child arrays, so children were never
// tombstoned and resurrected cross-device; enumerating here closes that hole.
async function dishCascadePairs(dishId: string) {
  const [itemIds, portionIds] = await Promise.all([
    db.dish_items.where('dish_id').equals(dishId).primaryKeys(),
    db.dish_portions.where('dish_id').equals(dishId).primaryKeys(),
  ]);
  return [
    ...itemIds.map((id) => ({ table: db.dish_items, id })),
    ...portionIds.map((id) => ({ table: db.dish_portions, id })),
    { table: db.dishes, id: dishId },
  ];
}

export async function deleteDish(dishId: string): Promise<void> {
  await deleteRows(await dishCascadePairs(dishId));
}

export async function deleteDishes(dishIds: string[]): Promise<void> {
  if (dishIds.length === 0) return;
  const pairs = (await Promise.all(dishIds.map((id) => dishCascadePairs(id)))).flat();
  await deleteRows(pairs);
}

export async function addDishItem(params: {
  dishId: string;
  productId: string;
  quantity: number;
  details?: string;
  /** Опциональный id — вызвавший может сгенерить его ЗАРАНЕЕ, чтобы пометить ряд
   *  «только что добавлен» (markAdded) ДО записи (см. addScheduleFood). */
  id?: string;
}): Promise<string> {
  const id = params.id ?? crypto.randomUUID();
  const row: Omit<DishItemRow, 'updated_at'> = {
    id,
    dish_id: params.dishId,
    product_id: params.productId,
    quantity: params.quantity,
    details: params.details ?? '',
    created_at: now(),
  };
  await putRow(db.dish_items, row);
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
  await updateRow(db.dish_items, itemId, patch);
}

export async function removeDishItem(itemId: string): Promise<void> {
  await deleteRow(db.dish_items, itemId);
}

export async function addDishPortion(
  dishId: string,
  portion: { label: string; grams: number },
): Promise<void> {
  const row: Omit<DishPortionRow, 'updated_at'> = {
    id: crypto.randomUUID(),
    dish_id: dishId,
    label: portion.label,
    grams: portion.grams,
    created_at: now(),
  };
  await putRow(db.dish_portions, row);
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
  await updateRow(db.dish_portions, portionId, updates);
}

export async function removeDishPortion(portionId: string): Promise<void> {
  await deleteRow(db.dish_portions, portionId);
}
