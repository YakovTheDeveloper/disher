import { db } from "@/powersync/database";
import { supabase } from "@/powersync/supabase-client";
import type { ClipboardItem } from "@/shared/model/clipboardStore";

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
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
  const userId = await currentUserId();
  const now = new Date().toISOString();
  await db.execute(
    `insert into schedule_foods
       (id, user_id, date, time, type, quantity, details, product_id, dish_id, created_at)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      params.date,
      params.time,
      params.type,
      params.quantity,
      params.details ?? "",
      params.productId ?? null,
      params.dishId ?? null,
      now,
    ],
  );
  return id;
}

export async function updateScheduleFood(
  itemId: string,
  updates: Partial<{
    date: string;
    time: string;
    type: "food" | "dish";
    quantity: number;
    details: string | null;
    productId: string | null;
    dishId: string | null;
  }>,
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

  const COLUMN_MAP: Record<string, string> = {
    date: "date",
    time: "time",
    type: "type",
    quantity: "quantity",
    details: "details",
    productId: "product_id",
    dishId: "dish_id",
  };

  const keys = Object.keys(updates) as (keyof typeof updates)[];
  if (keys.length === 0) return;
  const setClauses = keys.map((k) => `${COLUMN_MAP[k]} = ?`).join(", ");
  const values = keys.map((k) => {
    const v = updates[k];
    if (k === "details") return v ?? "";
    if (k === "productId" || k === "dishId") return v ?? null;
    return v;
  });

  await db.execute(
    `update schedule_foods set ${setClauses}, updated_at = ? where id = ?`,
    [...values, new Date().toISOString(), itemId],
  );
}

export async function removeScheduleFood(itemId: string): Promise<void> {
  await db.execute(
    `update schedule_foods set deleted_at = ? where id = ?`,
    [new Date().toISOString(), itemId],
  );
}

export async function removeScheduleFoods(itemIds: string[]): Promise<void> {
  const deletedAt = new Date().toISOString();
  await db.writeTransaction(async (tx) => {
    for (const id of itemIds) {
      await tx.execute(
        `update schedule_foods set deleted_at = ? where id = ?`,
        [deletedAt, id],
      );
    }
  });
}

export async function pasteClipboardItems(
  items: ClipboardItem[],
  targetDate: string,
): Promise<void> {
  const userId = await currentUserId();
  const now = new Date().toISOString();
  await db.writeTransaction(async (tx) => {
    for (const item of items) {
      await tx.execute(
        `insert into schedule_foods
           (id, user_id, date, time, type, quantity, details, product_id, dish_id, created_at)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          userId,
          targetDate,
          item.time,
          item.type,
          item.quantity,
          item.details ?? "",
          item.productId ?? null,
          item.dishId ?? null,
          now,
        ],
      );
    }
  });
}
