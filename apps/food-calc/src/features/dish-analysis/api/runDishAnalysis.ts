import { authedFetch } from '@/shared/lib/api/authedFetch';
import { API_BASE } from '@/shared/lib/api/base';
import { throwApiError } from '@/shared/lib/api/apiError';
import { db } from '@/shared/lib/dexie/schema';
import { asInsights, type AnalysisInsight } from '@/features/analysis/api';
import { saveDishAnalysis } from './storage';
import type { DishAnalysisIngredient, DishAnalysisPayload } from './types';

const ENDPOINT = `${API_BASE}/api/analyze-dish`;

// Hydrate the dish payload from Dexie + catalog. Mirrors the hydration
// pattern in features/analysis/api/runAnalysis.ts — both consult Dexie
// first, fall back to catalog by id.
export async function buildDishAnalysisPayload(
  dishId: string,
): Promise<DishAnalysisPayload> {
  const [dish, items] = await Promise.all([
    db.dishes.get(dishId),
    db.dish_items.where('dish_id').equals(dishId).toArray(),
  ]);

  const productIds = items.map((it) => it.product_id).filter(Boolean);
  const productNames = new Map<string, string>();

  if (productIds.length > 0) {
    const userProducts = await db.products
      .where('id')
      .anyOf(productIds)
      .toArray();
    for (const p of userProducts) productNames.set(p.id, p.name);

    const missing = productIds.filter((id) => !productNames.has(id));
    if (missing.length > 0) {
      const { catalog } = await import('@/shared/data/catalog');
      const missingSet = new Set(missing);
      for (const c of catalog) {
        if (missingSet.has(c.id)) productNames.set(c.id, c.name);
      }
    }
  }

  const ingredients: DishAnalysisIngredient[] = items.map((it) => ({
    name: productNames.get(it.product_id) ?? '?',
    grams: it.quantity,
    details: (it.details ?? '').trim(),
  }));

  const totalGrams = ingredients.reduce((sum, ing) => sum + ing.grams, 0);

  return {
    dishId,
    dishName: dish?.name ?? '',
    totalGrams,
    ingredients,
  };
}

export type DishAnalysisResult = {
  summary: string;
  insights: AnalysisInsight[];
};

type RequestArgs = {
  payload: DishAnalysisPayload;
  /** X-Request-Id idempotency key — caller-owned, reused on retry (dish has no
   *  server cache, so a stable id is the only guard against a double 2 ₽ debit). */
  requestId: string;
  signal?: AbortSignal;
};

// One-shot POST → structured {summary, insights} (the dish endpoint dropped its
// SSE markdown stream 2026-06-14; it now mirrors /api/analyze/daily, with the
// same charge/refund billing and X-Request-Id idempotency). Throws
// PaymentRequiredError on 402 (via throwApiError), like before.
export async function requestDishAnalysis(
  args: RequestArgs,
): Promise<DishAnalysisResult> {
  const { payload, requestId, signal } = args;

  const res = await authedFetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
    },
    body: JSON.stringify({
      dishName: payload.dishName,
      totalGrams: payload.totalGrams,
      ingredients: payload.ingredients,
    }),
    signal,
  });

  if (!res.ok) await throwApiError(res); // throws PaymentRequiredError on 402

  const body = (await res.json()) as { analysis?: { summary?: unknown; insights?: unknown } };
  const analysis = body?.analysis;
  if (!analysis || typeof analysis.summary !== 'string') {
    throw new Error('Некорректный ответ сервера');
  }

  return {
    summary: analysis.summary,
    insights: asInsights(analysis.insights),
  };
}

// Convenience wrapper: hydrate + request + persist. Called from the screen
// when the user taps «Проанализировать» or «Перезапустить». `requestId` is the
// idempotency key — the store mints it once per attempt and reuses it on a
// retry so a lost response can't re-charge.
export async function runDishAnalysis(args: {
  dishId: string;
  requestId: string;
  signal?: AbortSignal;
}): Promise<DishAnalysisResult> {
  const payload = await buildDishAnalysisPayload(args.dishId);
  const result = await requestDishAnalysis({ payload, requestId: args.requestId, signal: args.signal });
  if (args.signal?.aborted) return result;
  await saveDishAnalysis({
    dishId: args.dishId,
    summary: result.summary,
    insights: result.insights,
    createdAt: new Date().toISOString(),
  });
  return result;
}
