import { authedFetch } from '@/shared/lib/api/authedFetch';
import { API_BASE } from '@/shared/lib/api/base';
import { throwApiError } from '@/shared/lib/api/apiError';
import { db } from '@/shared/lib/dexie/schema';
import { createSSEParser } from '@/shared/lib/sse/parseSSELines';
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

type StreamArgs = {
  payload: DishAnalysisPayload;
  onChunk: (chunk: string) => void;
  signal?: AbortSignal;
};

// Stream the LLM response into onChunk and return the full accumulated text.
// Caller is responsible for persisting the result (or not, if aborted).
export async function streamDishAnalysis(args: StreamArgs): Promise<string> {
  const { payload, onChunk, signal } = args;

  const res = await authedFetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Request-Id': crypto.randomUUID(),
    },
    body: JSON.stringify({
      dishName: payload.dishName,
      totalGrams: payload.totalGrams,
      ingredients: payload.ingredients,
    }),
    signal,
  });

  if (!res.ok) await throwApiError(res); // throws PaymentRequiredError on 402

  let accumulated = '';
  const collect = (chunk: string) => {
    accumulated += chunk;
    onChunk(chunk);
  };

  // iOS Safari sometimes lacks ReadableStream on fetch responses — fall back
  // to a single text() read (same workaround as ScheduleFoodAnalyticsPage).
  if (!res.body) {
    const text = await res.text();
    if (signal?.aborted) return accumulated;
    const parser = createSSEParser(collect);
    const fed = parser.feed(text);
    if (fed.error) throw new Error(fed.error);
    const flushed = parser.end();
    if (flushed.error) throw new Error(flushed.error);
    return accumulated;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const parser = createSSEParser(collect);

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (signal?.aborted) break;

      const result = parser.feed(decoder.decode(value, { stream: true }));
      if (result.error) throw new Error(result.error);
      if (result.done) return accumulated;
    }
    const tail = parser.end();
    if (tail.error) throw new Error(tail.error);
  } finally {
    reader.releaseLock();
  }

  return accumulated;
}

// Convenience wrapper: hydrate + stream + persist. Called from the screen
// when the user taps «Проанализировать» or «Перезапустить».
export async function runDishAnalysis(args: {
  dishId: string;
  onChunk: (chunk: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const payload = await buildDishAnalysisPayload(args.dishId);
  const resultMd = await streamDishAnalysis({
    payload,
    onChunk: args.onChunk,
    signal: args.signal,
  });
  if (args.signal?.aborted) return resultMd;
  await saveDishAnalysis({
    dishId: args.dishId,
    resultMd,
    createdAt: new Date().toISOString(),
  });
  return resultMd;
}
