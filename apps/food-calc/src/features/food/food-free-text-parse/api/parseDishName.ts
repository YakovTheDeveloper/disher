import { API_BASE } from '@/shared/lib/api/base';
import { authedFetch } from '@/shared/lib/api/authedFetch';
import { throwApiError } from '@/shared/lib/api/apiError';
import type { ParseResponse } from './parseFreeTextFood';

// Head A — "infer recipe": dish name → typical ingredients matched against the
// catalog, returned in the SAME `ParseResponse` shape as `parseFreeTextFood`
// (head B) so `useWriteFoodFlow` feeds both into one state machine + предложка.
export async function parseDishName(
  dishName: string,
  signal?: AbortSignal,
): Promise<ParseResponse> {
  const res = await authedFetch(`${API_BASE}/api/suggestions/dish-products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Request-Id': crypto.randomUUID(),
    },
    body: JSON.stringify({ dishName }),
    signal,
  });

  if (!res.ok) await throwApiError(res); // throws PaymentRequiredError on 402

  return res.json() as Promise<ParseResponse>;
}
