import { get, set, del } from 'idb-keyval';
import type { DishAnalysis } from './types';

// idb-keyval pointer: dishId → latest analysis. Server is not the writer here
// (see backend analyze-dish.ts) — analysis is a derivative of the dish that
// each device computes on demand. Sign-out wipes idb-keyval together with
// Dexie, so we don't need a separate cleanup path.

const key = (dishId: string) => `dish-analysis:${dishId}`;

export async function getDishAnalysis(
  dishId: string,
): Promise<DishAnalysis | null> {
  const v = await get<DishAnalysis>(key(dishId));
  return v ?? null;
}

export async function saveDishAnalysis(a: DishAnalysis): Promise<void> {
  await set(key(a.dishId), a);
}

export async function deleteDishAnalysis(dishId: string): Promise<void> {
  await del(key(dishId));
}
