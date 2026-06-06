import { API_BASE } from '@/shared/lib/api/base';
import type { ParseResponse } from './parseFreeTextFood';

// Head A — "infer recipe": dish name → typical ingredients matched against the
// catalog, returned in the SAME `ParseResponse` shape as `parseFreeTextFood`
// (head B) so `useWriteFoodFlow` feeds both into one state machine + предложка.
export async function parseDishName(
  dishName: string,
  signal?: AbortSignal,
): Promise<ParseResponse> {
  const res = await fetch(`${API_BASE}/api/suggestions/dish-products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ dishName }),
    signal,
  });

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body?.error === 'string') errorMsg = body.error;
    } catch {
      // keep HTTP code
    }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<ParseResponse>;
}
