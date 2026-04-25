import { db } from "@/powersync/database";
import { supabase } from "@/powersync/supabase-client";
import type { DailyNormItems } from "../model/types";

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export async function createDailyNorm(
  name: string,
  description: string,
  items?: DailyNormItems,
): Promise<string> {
  const id = crypto.randomUUID();
  const userId = await currentUserId();
  const now = new Date().toISOString();
  await db.execute(
    `insert into daily_norms (id, user_id, name, description, items, created_at)
     values (?, ?, ?, ?, ?, ?)`,
    [id, userId, name, description, JSON.stringify(items ?? {}), now],
  );
  return id;
}

export async function updateDailyNorm(
  normId: string,
  updates: Partial<{ name: string; description: string; items: string }>,
): Promise<void> {
  const keys = Object.keys(updates) as (keyof typeof updates)[];
  if (keys.length === 0) return;
  const setClauses = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => updates[k]);
  await db.execute(
    `update daily_norms set ${setClauses}, updated_at = ? where id = ?`,
    [...values, new Date().toISOString(), normId],
  );
}

export async function deleteDailyNorm(normId: string): Promise<void> {
  await db.execute(
    `update daily_norms set deleted_at = ? where id = ?`,
    [new Date().toISOString(), normId],
  );
}

export async function setDailyNormNutrient(
  normId: string,
  nutrientId: string,
  quantity: number | null,
  currentItems: DailyNormItems,
): Promise<void> {
  const next = { ...currentItems };
  if (quantity === null || quantity === 0) {
    delete next[nutrientId];
  } else {
    next[nutrientId] = quantity;
  }
  await db.execute(
    `update daily_norms set items = ?, updated_at = ? where id = ?`,
    [JSON.stringify(next), new Date().toISOString(), normId],
  );
}

export async function seedDefaultDailyNorm(
  defaults: Record<string, number>,
): Promise<void> {
  const normId = "DEFAULT_NORM";
  const userId = await currentUserId();
  const now = new Date().toISOString();
  await db.execute(
    `insert into daily_norms (id, user_id, name, description, items, created_at)
     values (?, ?, ?, ?, ?, ?)
     on conflict(id) do nothing`,
    [
      normId,
      userId,
      "Стандарт",
      "Стандартная норма потребления, для среднестатистического человека",
      JSON.stringify(defaults),
      now,
    ],
  );
}
