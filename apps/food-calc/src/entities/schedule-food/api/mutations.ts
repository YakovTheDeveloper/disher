import { enqueue, drain } from "@/shared/lib/storage/pendingWrites";
import { queryClient } from "@/shared/lib/storage/queryClient";
import { getUserIdSync } from "@/shared/lib/auth/useUserId";
import type { ClipboardItem } from "@/shared/model/clipboardStore";
import type { ScheduleFood } from "../model/types";

const TABLE = "schedule_foods";

function requireUserId(): string {
  const userId = getUserIdSync();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

function invalidateScheduleFoods() {
  void queryClient.invalidateQueries({ queryKey: ["schedule_foods"] });
}

function patchScheduleFoodsCache(updater: (rows: ScheduleFood[]) => ScheduleFood[]) {
  queryClient.setQueriesData<ScheduleFood[]>(
    { queryKey: ["schedule_foods", "all"] },
    (old) => (old ? updater(old) : old),
  );
}

export async function addScheduleFood(params: {
  date: string;
  time: string;
  type: "food" | "dish";
  quantity: number;
  productId?: string | null;
  dishId?: string | null;
  details?: string | null;
}): Promise<string> {
  const hasProductId = params.productId != null;
  const hasDishId = params.dishId != null;
  if (hasProductId && hasDishId) {
    throw new Error("addScheduleFood: cannot set both productId and dishId");
  }
  if (!hasProductId && !hasDishId) {
    throw new Error("addScheduleFood: must set either productId or dishId");
  }

  const id = crypto.randomUUID();
  const userId = requireUserId();
  const now = new Date().toISOString();

  const row = {
    id,
    user_id: userId,
    date: params.date,
    time: params.time,
    type: params.type,
    quantity: params.quantity,
    details: params.details ?? "",
    product_id: params.productId ?? null,
    dish_id: params.dishId ?? null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  const optimistic: ScheduleFood = {
    id,
    userId,
    date: params.date,
    time: params.time,
    type: params.type,
    quantity: params.quantity,
    details: params.details ?? "",
    productId: params.productId ?? null,
    dishId: params.dishId ?? null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  patchScheduleFoodsCache((rows) => [...rows, optimistic]);

  await enqueue({ table: TABLE, op: "insert", payload: row });
  void drain();
  invalidateScheduleFoods();
  return id;
}

type ScheduleFoodUpdates = Partial<{
  date: string;
  time: string;
  type: "food" | "dish";
  quantity: number;
  details: string | null;
  productId: string | null;
  dishId: string | null;
}>;

const COLUMN_MAP: Record<keyof ScheduleFoodUpdates, string> = {
  date: "date",
  time: "time",
  type: "type",
  quantity: "quantity",
  details: "details",
  productId: "product_id",
  dishId: "dish_id",
};

export async function updateScheduleFood(
  itemId: string,
  updates: ScheduleFoodUpdates,
): Promise<void> {
  if (updates.productId !== undefined && updates.dishId !== undefined) {
    const hasProductId = updates.productId != null;
    const hasDishId = updates.dishId != null;
    if (hasProductId && hasDishId) {
      throw new Error("updateScheduleFood: cannot set both productId and dishId");
    }
    if (!hasProductId && !hasDishId) {
      throw new Error("updateScheduleFood: must set either productId or dishId");
    }
  }

  const keys = Object.keys(updates) as (keyof ScheduleFoodUpdates)[];
  if (keys.length === 0) return;

  patchScheduleFoodsCache((rows) =>
    rows.map((r) => {
      if (r.id !== itemId) return r;
      const next: ScheduleFood = { ...r };
      for (const k of keys) {
        if (k === "details") {
          next.details = (updates.details ?? "") as string;
        } else if (k === "productId") {
          next.productId = updates.productId ?? null;
        } else if (k === "dishId") {
          next.dishId = updates.dishId ?? null;
        } else if (k === "type") {
          next.type = updates.type as "food" | "dish";
        } else if (k === "quantity") {
          next.quantity = updates.quantity as number;
        } else if (k === "date") {
          next.date = updates.date as string;
        } else if (k === "time") {
          next.time = updates.time as string;
        }
      }
      next.updatedAt = new Date().toISOString();
      return next;
    }),
  );

  const payload: Record<string, unknown> = {
    id: itemId,
    updated_at: new Date().toISOString(),
  };
  for (const k of keys) {
    const col = COLUMN_MAP[k];
    if (k === "details") payload[col] = updates.details ?? "";
    else if (k === "productId" || k === "dishId") payload[col] = updates[k] ?? null;
    else payload[col] = updates[k];
  }

  await enqueue({ table: TABLE, op: "upsert", payload });
  void drain();
  invalidateScheduleFoods();
}

export async function removeScheduleFood(itemId: string): Promise<void> {
  patchScheduleFoodsCache((rows) => rows.filter((r) => r.id !== itemId));
  await enqueue({ table: TABLE, op: "delete", payload: { id: itemId } });
  void drain();
  invalidateScheduleFoods();
}

export async function removeScheduleFoods(itemIds: string[]): Promise<void> {
  if (itemIds.length === 0) return;
  const idSet = new Set(itemIds);
  patchScheduleFoodsCache((rows) => rows.filter((r) => !idSet.has(r.id)));
  for (const id of itemIds) {
    await enqueue({ table: TABLE, op: "delete", payload: { id } });
  }
  void drain();
  invalidateScheduleFoods();
}

export async function pasteClipboardItems(
  items: ClipboardItem[],
  targetDate: string,
): Promise<void> {
  if (items.length === 0) return;
  const userId = requireUserId();
  const now = new Date().toISOString();

  const optimisticRows: ScheduleFood[] = [];
  const payloads: Record<string, unknown>[] = [];

  for (const item of items) {
    const id = crypto.randomUUID();
    optimisticRows.push({
      id,
      userId,
      date: targetDate,
      time: item.time,
      type: item.type,
      quantity: item.quantity,
      details: item.details ?? "",
      productId: item.productId ?? null,
      dishId: item.dishId ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
    payloads.push({
      id,
      user_id: userId,
      date: targetDate,
      time: item.time,
      type: item.type,
      quantity: item.quantity,
      details: item.details ?? "",
      product_id: item.productId ?? null,
      dish_id: item.dishId ?? null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });
  }

  patchScheduleFoodsCache((rows) => [...rows, ...optimisticRows]);

  for (const payload of payloads) {
    await enqueue({ table: TABLE, op: "insert", payload });
  }
  void drain();
  invalidateScheduleFoods();
}
