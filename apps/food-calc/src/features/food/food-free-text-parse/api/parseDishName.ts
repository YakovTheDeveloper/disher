import { API_BASE } from '@/shared/lib/api/base';
import { authedFetch } from '@/shared/lib/api/authedFetch';
import { throwApiError } from '@/shared/lib/api/apiError';
import type { ParseResponse } from './parseFreeTextFood';

// Head A — "infer recipe": dish name → typical ingredients matched against the
// catalog, returned in the SAME `ParseResponse` shape as `parseFreeTextFood`
// (head B) so `useWriteFoodFlow` feeds both into one state machine + предложка.
// `requestId` is the X-Request-Id idempotency key — caller-owned, reused across
// a grace-resubmit / retry so the paid infer-recipe call debits at most once.
// See parseFreeTextFood for the full contract (both heads share it).
export async function parseDishName(
  dishName: string,
  requestId: string,
  comment?: string,
  signal?: AbortSignal,
): Promise<ParseResponse> {
  const trimmedComment = comment?.trim();
  const res = await authedFetch(`${API_BASE}/api/suggestions/dish-products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Request-Id': requestId,
    },
    // Omit `comment` entirely when empty so the no-clarification path hits the
    // same backend cache key it did before this feature existed.
    body: JSON.stringify(trimmedComment ? { dishName, comment: trimmedComment } : { dishName }),
    signal,
  });

  if (!res.ok) await throwApiError(res); // throws PaymentRequiredError on 402

  return res.json() as Promise<ParseResponse>;
}
