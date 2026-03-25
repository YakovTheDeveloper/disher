import { triplit } from "@/api/triplit/client";
import { getCurrentUserId } from "@/api/triplit/session";
import { v4 as uuid } from "uuid";
import type { DailyNormItems } from "../model/types";

export async function createDailyNorm(name: string, description: string) {
  const id = uuid();
  await triplit.insert("dailyNorms", {
    id,
    name,
    description,
    userId: getCurrentUserId(),
    items: {},
  });
  return id;
}

export async function updateDailyNorm(
  normId: string,
  updates: Partial<{ name: string; description: string }>,
) {
  await triplit.update("dailyNorms", normId, (norm) => {
    if (updates.name !== undefined) norm.name = updates.name;
    if (updates.description !== undefined) norm.description = updates.description;
  });
}

export async function deleteDailyNorm(normId: string) {
  await triplit.delete("dailyNorms", normId);
}

export async function setDailyNormNutrient(
  normId: string,
  nutrientId: string,
  quantity: number | null,
) {
  const norm = await triplit.fetchById("dailyNorms", normId);
  if (!norm) return;

  const items = (norm.items ?? {}) as DailyNormItems;
  const next = { ...items };

  if (quantity === null || quantity === 0) {
    delete next[nutrientId];
  } else {
    next[nutrientId] = quantity;
  }

  await triplit.update("dailyNorms", normId, (n) => {
    n.items = next;
  });
}

export async function seedDefaultDailyNorm(defaults: Record<string, number>) {
  const normId = "DEFAULT_NORM";
  const existing = await triplit.fetchById("dailyNorms", normId);
  if (existing) return;

  await triplit.insert("dailyNorms", {
    id: normId,
    name: "Стандарт",
    description: "Стандартная норма потребления, для среднестатистического человека",
    userId: getCurrentUserId(),
    items: defaults,
  });
}
