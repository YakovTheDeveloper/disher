import { enqueue, enqueueMany, drain, type PendingWrite } from "@/shared/lib/storage/pendingWrites";
import { queryClient } from "@/shared/lib/storage/queryClient";
import { getUserIdSync } from "@/shared/lib/auth/useUserId";
import type { Dish, DishItem, DishPortion } from "../model/types";

type EnqueueInput = Pick<PendingWrite, "table" | "op" | "payload">;

const DISH_TABLE = "dishes";
const DISH_ITEM_TABLE = "dish_items";
const DISH_PORTION_TABLE = "dish_portions";
const SCHEDULE_FOOD_TABLE = "schedule_foods";

function requireUserId(): string {
  const userId = getUserIdSync();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

function patchDishesCache(updater: (rows: Dish[]) => Dish[]) {
  queryClient.setQueriesData<Dish[]>({ queryKey: ["dishes", "all"] }, (old) =>
    old ? updater(old) : old,
  );
}

function patchDishItemsCache(updater: (rows: DishItem[]) => DishItem[]) {
  queryClient.setQueriesData<DishItem[]>({ queryKey: ["dish_items", "all"] }, (old) =>
    old ? updater(old) : old,
  );
}

function patchDishPortionsCache(updater: (rows: DishPortion[]) => DishPortion[]) {
  queryClient.setQueriesData<DishPortion[]>({ queryKey: ["dish_portions", "all"] }, (old) =>
    old ? updater(old) : old,
  );
}

export async function createDish(name: string): Promise<string> {
  const id = crypto.randomUUID();
  const userId = requireUserId();
  const now = new Date().toISOString();

  const row = {
    id,
    user_id: userId,
    name,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  const optimistic: Dish = {
    id,
    userId,
    name,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  patchDishesCache((rows) => [...rows, optimistic]);

  await enqueue({ table: DISH_TABLE, op: "insert", payload: row });
  void drain();
  return id;
}

export async function updateDishName(dishId: string, name: string): Promise<void> {
  const now = new Date().toISOString();
  patchDishesCache((rows) =>
    rows.map((d) => (d.id === dishId ? { ...d, name, updatedAt: now } : d)),
  );
  await enqueue({
    table: DISH_TABLE,
    op: "upsert",
    payload: { id: dishId, name, updated_at: now },
  });
  void drain();
}

export async function deleteDish(
  dishId: string,
  itemIds: string[],
  portionIds: string[],
): Promise<void> {
  // No invalidate after enqueue — see deleteProduct comment (delete-flicker race).
  const itemSet = new Set(itemIds);
  const portionSet = new Set(portionIds);

  patchDishesCache((rows) => rows.filter((d) => d.id !== dishId));
  if (itemIds.length > 0) {
    patchDishItemsCache((rows) => rows.filter((r) => !itemSet.has(r.id)));
  }
  if (portionIds.length > 0) {
    patchDishPortionsCache((rows) => rows.filter((r) => !portionSet.has(r.id)));
  }

  // FIFO order preserved: items → portions → dish (children before parent).
  await enqueueMany([
    ...itemIds.map((id) => ({
      table: DISH_ITEM_TABLE,
      op: "delete" as const,
      payload: { id },
    })),
    ...portionIds.map((id) => ({
      table: DISH_PORTION_TABLE,
      op: "delete" as const,
      payload: { id },
    })),
    { table: DISH_TABLE, op: "delete" as const, payload: { id: dishId } },
  ]);

  void drain();
}

export async function deleteDishes(
  dishes: Array<{ id: string; itemIds: string[]; portionIds: string[] }>,
): Promise<void> {
  if (dishes.length === 0) return;

  const dishIdSet = new Set(dishes.map((d) => d.id));
  const itemIdSet = new Set(dishes.flatMap((d) => d.itemIds));
  const portionIdSet = new Set(dishes.flatMap((d) => d.portionIds));

  patchDishesCache((rows) => rows.filter((d) => !dishIdSet.has(d.id)));
  if (itemIdSet.size > 0) {
    patchDishItemsCache((rows) => rows.filter((r) => !itemIdSet.has(r.id)));
  }
  if (portionIdSet.size > 0) {
    patchDishPortionsCache((rows) => rows.filter((r) => !portionIdSet.has(r.id)));
  }

  // Per-dish FIFO: items → portions → dish; preserved across the flat array.
  const writes: EnqueueInput[] = [];
  for (const d of dishes) {
    for (const id of d.itemIds) {
      writes.push({ table: DISH_ITEM_TABLE, op: "delete", payload: { id } });
    }
    for (const id of d.portionIds) {
      writes.push({ table: DISH_PORTION_TABLE, op: "delete", payload: { id } });
    }
    writes.push({ table: DISH_TABLE, op: "delete", payload: { id: d.id } });
  }
  await enqueueMany(writes);

  void drain();
}

export async function addDishItem(params: {
  dishId: string;
  productId: string;
  quantity: number;
}): Promise<string> {
  const id = crypto.randomUUID();
  const userId = requireUserId();
  const now = new Date().toISOString();

  const row = {
    id,
    user_id: userId,
    dish_id: params.dishId,
    product_id: params.productId,
    quantity: params.quantity,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  const optimistic: DishItem = {
    id,
    userId,
    dishId: params.dishId,
    productId: params.productId,
    quantity: params.quantity,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  patchDishItemsCache((rows) => [...rows, optimistic]);

  await enqueue({ table: DISH_ITEM_TABLE, op: "insert", payload: row });
  void drain();
  return id;
}

type DishItemUpdates = Partial<{ quantity: number; productId: string }>;

const DISH_ITEM_COLUMN_MAP: Record<keyof DishItemUpdates, string> = {
  quantity: "quantity",
  productId: "product_id",
};

export async function updateDishItem(
  itemId: string,
  updates: DishItemUpdates,
): Promise<void> {
  const keys = Object.keys(updates) as (keyof DishItemUpdates)[];
  if (keys.length === 0) return;

  const now = new Date().toISOString();
  patchDishItemsCache((rows) =>
    rows.map((r) => {
      if (r.id !== itemId) return r;
      const next: DishItem = { ...r };
      for (const k of keys) {
        if (k === "quantity") next.quantity = updates.quantity as number;
        else if (k === "productId") next.productId = updates.productId as string;
      }
      next.updatedAt = now;
      return next;
    }),
  );

  const payload: Record<string, unknown> = { id: itemId, updated_at: now };
  for (const k of keys) {
    payload[DISH_ITEM_COLUMN_MAP[k]] = updates[k];
  }

  await enqueue({ table: DISH_ITEM_TABLE, op: "upsert", payload });
  void drain();
}

export async function removeDishItem(itemId: string): Promise<void> {
  // No invalidate after enqueue — see deleteProduct comment (delete-flicker race).
  patchDishItemsCache((rows) => rows.filter((r) => r.id !== itemId));
  await enqueue({ table: DISH_ITEM_TABLE, op: "delete", payload: { id: itemId } });
  void drain();
}

export async function copyDishItems(
  items: Array<{ productId: string; quantity: number }>,
  toDishId: string,
): Promise<void> {
  if (items.length === 0) return;
  const userId = requireUserId();
  const now = new Date().toISOString();

  const optimisticRows: DishItem[] = [];
  const payloads: Record<string, unknown>[] = [];

  for (const item of items) {
    const id = crypto.randomUUID();
    optimisticRows.push({
      id,
      userId,
      dishId: toDishId,
      productId: item.productId,
      quantity: item.quantity,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
    payloads.push({
      id,
      user_id: userId,
      dish_id: toDishId,
      product_id: item.productId,
      quantity: item.quantity,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });
  }

  patchDishItemsCache((rows) => [...rows, ...optimisticRows]);

  await enqueueMany(
    payloads.map((payload) => ({ table: DISH_ITEM_TABLE, op: "insert" as const, payload })),
  );
  void drain();
}

export async function addDishPortion(
  dishId: string,
  portion: { label: string; amount: number; unit: string; grams: number },
): Promise<void> {
  const id = crypto.randomUUID();
  const userId = requireUserId();
  const now = new Date().toISOString();

  const row = {
    id,
    user_id: userId,
    dish_id: dishId,
    label: portion.label,
    amount: portion.amount,
    unit: portion.unit,
    grams: portion.grams,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  const optimistic: DishPortion = {
    id,
    userId,
    dishId,
    label: portion.label,
    amount: portion.amount,
    unit: portion.unit,
    grams: portion.grams,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  patchDishPortionsCache((rows) => [...rows, optimistic]);

  await enqueue({ table: DISH_PORTION_TABLE, op: "insert", payload: row });
  void drain();
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

  const now = new Date().toISOString();
  patchDishPortionsCache((rows) =>
    rows.map((r) => {
      if (r.id !== portionId) return r;
      const next: DishPortion = { ...r };
      for (const k of keys) {
        if (k === "label") next.label = updates.label as string;
        else if (k === "amount") next.amount = updates.amount as number;
        else if (k === "unit") next.unit = updates.unit as string;
        else if (k === "grams") next.grams = updates.grams as number;
      }
      next.updatedAt = now;
      return next;
    }),
  );

  const payload: Record<string, unknown> = { id: portionId, updated_at: now };
  for (const k of keys) {
    payload[k] = updates[k];
  }

  await enqueue({ table: DISH_PORTION_TABLE, op: "upsert", payload });
  void drain();
}

export async function removeDishPortion(portionId: string): Promise<void> {
  // No invalidate after enqueue — see deleteProduct comment (delete-flicker race).
  patchDishPortionsCache((rows) => rows.filter((r) => r.id !== portionId));
  await enqueue({ table: DISH_PORTION_TABLE, op: "delete", payload: { id: portionId } });
  void drain();
}

export async function dishItemsToScheduleFoods(
  items: Array<{ productId: string; quantity: number }>,
  date: string,
  time: string,
): Promise<void> {
  if (items.length === 0) return;
  const userId = requireUserId();
  const now = new Date().toISOString();

  const payloads: Record<string, unknown>[] = items.map((item) => ({
    id: crypto.randomUUID(),
    user_id: userId,
    date,
    time,
    type: "food",
    quantity: item.quantity,
    product_id: item.productId,
    dish_id: null,
    details: "",
    created_at: now,
    updated_at: now,
    deleted_at: null,
  }));

  // Optimistic insert into schedule_foods cache.
  queryClient.setQueriesData<Record<string, unknown>[]>(
    { queryKey: ["schedule_foods", "all"] },
    (old) => {
      if (!old) return old;
      const optimisticRows = payloads.map((p) => ({
        id: p.id,
        userId: p.user_id,
        date: p.date,
        time: p.time,
        type: p.type,
        quantity: p.quantity,
        details: p.details,
        productId: p.product_id,
        dishId: p.dish_id,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        deletedAt: p.deleted_at,
      }));
      return [...old, ...optimisticRows];
    },
  );

  await enqueueMany(
    payloads.map((payload) => ({ table: SCHEDULE_FOOD_TABLE, op: "insert" as const, payload })),
  );
  void drain();
}
