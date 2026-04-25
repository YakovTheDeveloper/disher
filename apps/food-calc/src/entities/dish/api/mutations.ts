import { db } from "@/powersync/database";
import { supabase } from "@/powersync/supabase-client";

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export async function createDish(name: string): Promise<string> {
  const id = crypto.randomUUID();
  const userId = await currentUserId();
  const now = new Date().toISOString();
  await db.execute(
    `insert into dishes (id, user_id, name, created_at) values (?, ?, ?, ?)`,
    [id, userId, name, now],
  );
  return id;
}

export async function updateDishName(dishId: string, name: string): Promise<void> {
  await db.execute(
    `update dishes set name = ?, updated_at = ? where id = ?`,
    [name, new Date().toISOString(), dishId],
  );
}

export async function deleteDish(
  dishId: string,
  itemIds: string[],
  portionIds: string[],
): Promise<void> {
  const deletedAt = new Date().toISOString();
  await db.writeTransaction(async (tx) => {
    for (const id of itemIds) {
      await tx.execute(`update dish_items set deleted_at = ? where id = ?`, [deletedAt, id]);
    }
    for (const id of portionIds) {
      await tx.execute(`update dish_portions set deleted_at = ? where id = ?`, [deletedAt, id]);
    }
    await tx.execute(`update dishes set deleted_at = ? where id = ?`, [deletedAt, dishId]);
  });
}

export async function deleteDishes(
  dishes: Array<{ id: string; itemIds: string[]; portionIds: string[] }>,
): Promise<void> {
  const deletedAt = new Date().toISOString();
  await db.writeTransaction(async (tx) => {
    for (const d of dishes) {
      for (const id of d.itemIds) {
        await tx.execute(`update dish_items set deleted_at = ? where id = ?`, [deletedAt, id]);
      }
      for (const id of d.portionIds) {
        await tx.execute(`update dish_portions set deleted_at = ? where id = ?`, [deletedAt, id]);
      }
      await tx.execute(`update dishes set deleted_at = ? where id = ?`, [deletedAt, d.id]);
    }
  });
}

export async function addDishItem(params: {
  dishId: string;
  productId: string;
  quantity: number;
}): Promise<string> {
  const id = crypto.randomUUID();
  const userId = await currentUserId();
  const now = new Date().toISOString();
  await db.execute(
    `insert into dish_items (id, user_id, dish_id, product_id, quantity, created_at)
     values (?, ?, ?, ?, ?, ?)`,
    [id, userId, params.dishId, params.productId, params.quantity, now],
  );
  return id;
}

export async function updateDishItem(
  itemId: string,
  updates: Partial<{ quantity: number; productId: string }>,
): Promise<void> {
  const COLUMN_MAP: Record<string, string> = {
    quantity: "quantity",
    productId: "product_id",
  };
  const keys = Object.keys(updates) as (keyof typeof updates)[];
  if (keys.length === 0) return;
  const setClauses = keys.map((k) => `${COLUMN_MAP[k]} = ?`).join(", ");
  const values = keys.map((k) => updates[k]);
  await db.execute(
    `update dish_items set ${setClauses}, updated_at = ? where id = ?`,
    [...values, new Date().toISOString(), itemId],
  );
}

export async function removeDishItem(itemId: string): Promise<void> {
  await db.execute(
    `update dish_items set deleted_at = ? where id = ?`,
    [new Date().toISOString(), itemId],
  );
}

export async function copyDishItems(
  items: Array<{ productId: string; quantity: number }>,
  toDishId: string,
): Promise<void> {
  const userId = await currentUserId();
  const now = new Date().toISOString();
  await db.writeTransaction(async (tx) => {
    for (const item of items) {
      await tx.execute(
        `insert into dish_items (id, user_id, dish_id, product_id, quantity, created_at)
         values (?, ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), userId, toDishId, item.productId, item.quantity, now],
      );
    }
  });
}

export async function addDishPortion(
  dishId: string,
  portion: { label: string; amount: number; unit: string; grams: number },
): Promise<void> {
  const userId = await currentUserId();
  const now = new Date().toISOString();
  await db.execute(
    `insert into dish_portions (id, user_id, dish_id, label, amount, unit, grams, created_at)
     values (?, ?, ?, ?, ?, ?, ?, ?)`,
    [crypto.randomUUID(), userId, dishId, portion.label, portion.amount, portion.unit, portion.grams, now],
  );
}

export async function updateDishPortion(
  portionId: string,
  updates: Partial<{ label: string; amount: number; unit: string; grams: number }>,
): Promise<void> {
  const keys = Object.keys(updates) as (keyof typeof updates)[];
  if (keys.length === 0) return;
  const setClauses = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => updates[k]);
  await db.execute(
    `update dish_portions set ${setClauses}, updated_at = ? where id = ?`,
    [...values, new Date().toISOString(), portionId],
  );
}

export async function removeDishPortion(portionId: string): Promise<void> {
  await db.execute(
    `update dish_portions set deleted_at = ? where id = ?`,
    [new Date().toISOString(), portionId],
  );
}

export async function dishItemsToScheduleFoods(
  items: Array<{ productId: string; quantity: number }>,
  date: string,
  time: string,
): Promise<void> {
  const userId = await currentUserId();
  const now = new Date().toISOString();
  await db.writeTransaction(async (tx) => {
    for (const item of items) {
      await tx.execute(
        `insert into schedule_foods
           (id, user_id, date, time, type, quantity, product_id, dish_id, details, created_at)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), userId, date, time, "food", item.quantity, item.productId, "", "", now],
      );
    }
  });
}
