import { API_BASE } from '@/shared/lib/api/base';
import { authedFetch } from '@/shared/lib/api/authedFetch';
import { throwApiError } from '@/shared/lib/api/apiError';
import { allNutrientsList } from '@/entities/nutrient/ui/NutrientGroup/constants';

// Frontend owns the nutrient catalog. We send the backend a nutrient-agnostic
// spec (english `name` key + RU label + unit); it drives both the LLM prompt and
// the strict json_schema off this list and answers keyed by the same `name`.
const NUTRIENT_SPEC = allNutrientsList.map((n) => ({
  name: n.name,
  label: n.displayNameRu,
  unit: n.unit,
}));

// name → nutrient id (stable; the catalog is a const). Used to map the LLM's
// name-keyed answer back to the id-keyed Record `setProductNutrients` expects.
const NAME_TO_ID = new Map(allNutrientsList.map((n) => [n.name, n.id]));

interface SuggestResponse {
  /** Estimated quantity per 100 g, keyed by nutrient english `name`. */
  values: Record<string, number>;
}

/**
 * name-keyed LLM answer → id-keyed Record, which `setProductNutrients` expects.
 * Shared with the proposal-rescue flow: dish-products rides the same name keys.
 */
export function mapNutrientNamesToIds(
  values: Record<string, number>,
): Record<string, number> {
  const record: Record<string, number> = {};
  for (const [name, v] of Object.entries(values ?? {})) {
    const id = NAME_TO_ID.get(name);
    if (id && typeof v === 'number' && v > 0) record[id] = v;
  }
  return record;
}

/**
 * Ask the backend to estimate a product's full nutrient profile (per 100 g) from
 * its name. Returns a Record keyed by nutrient ID — ready to JSON.stringify into
 * `setProductNutrients`. Throws `PaymentRequiredError` on 402.
 */
export async function suggestProductNutrients(
  productName: string,
  requestId: string,
  options?: { signal?: AbortSignal; details?: string },
): Promise<Record<string, number>> {
  const res = await authedFetch(`${API_BASE}/api/suggestions/product-nutrients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Caller-owned idempotency key: reused on a retry of the same product so
      // a lost response doesn't double-debit the 0.5 ₽ suggest charge.
      'X-Request-Id': requestId,
    },
    body: JSON.stringify({
      productName,
      nutrients: NUTRIENT_SPEC,
      ...(options?.details ? { details: options.details } : {}),
    }),
    signal: options?.signal,
  });

  if (!res.ok) await throwApiError(res); // throws PaymentRequiredError on 402

  const { values } = (await res.json()) as SuggestResponse;
  return mapNutrientNamesToIds(values ?? {});
}
