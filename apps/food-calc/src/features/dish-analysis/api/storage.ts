import { get, set, del } from 'idb-keyval';
import type { AnalysisInsight } from '@/features/analysis/api';
import type { DishAnalysis } from './types';

// idb-keyval pointer: dishId → latest analysis. Server is not the writer here
// (see backend analyze-dish.ts) — analysis is a derivative of the dish that
// each device computes on demand. Sign-out wipes idb-keyval together with
// Dexie, so we don't need a separate cleanup path.

const key = (dishId: string) => `dish-analysis:${dishId}`;

// Coerce a stored record into the CURRENT structured shape. A record written by
// the pre-2026-06-14 streaming build carries `{ resultMd }` and no summary/
// insights — carry the markdown over to `summary` and default insights to []
// so AnalysisResult renders the cached разбор instead of crashing on `.length`.
function normalizeStored(raw: unknown, dishId: string): DishAnalysis | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const summary =
    typeof r.summary === 'string'
      ? r.summary
      : typeof r.resultMd === 'string'
        ? r.resultMd
        : '';
  const insights = Array.isArray(r.insights)
    ? (r.insights as AnalysisInsight[])
    : [];
  const createdAt = typeof r.createdAt === 'string' ? r.createdAt : '';
  return { dishId, summary, insights, createdAt };
}

export async function getDishAnalysis(
  dishId: string,
): Promise<DishAnalysis | null> {
  const v = await get(key(dishId));
  return v == null ? null : normalizeStored(v, dishId);
}

export async function saveDishAnalysis(a: DishAnalysis): Promise<void> {
  await set(key(a.dishId), a);
}

export async function deleteDishAnalysis(dishId: string): Promise<void> {
  await del(key(dishId));
}
