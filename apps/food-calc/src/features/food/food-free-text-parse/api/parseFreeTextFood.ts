import { API_BASE } from '@/shared/lib/api/base';
import { authedFetch } from '@/shared/lib/api/authedFetch';
import { throwApiError } from '@/shared/lib/api/apiError';

export interface MatchCandidate {
  id: string;
  name: string;
  score: number;
}

export interface ResolvedItem {
  productId: string;
  name: string;
  originalName: string;
  details: string;
  quantity: number;
  time: string;
  confidence: number;
}

export interface AmbiguousItem {
  originalName: string;
  details: string;
  quantity: number;
  time: string;
  candidates: MatchCandidate[];
}

export interface UnresolvedItem {
  originalName: string;
  details: string;
  quantity: number;
  time: string;
}

export interface ParseResponse {
  requestId: string;
  resolved: ResolvedItem[];
  ambiguous: AmbiguousItem[];
  unresolved: UnresolvedItem[];
}

export async function parseFreeTextFood(
  text: string,
  signal?: AbortSignal,
): Promise<ParseResponse> {
  const res = await authedFetch(`${API_BASE}/api/free-text-food/parse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Request-Id': crypto.randomUUID(),
    },
    body: JSON.stringify({ text }),
    signal,
  });

  if (!res.ok) await throwApiError(res); // throws PaymentRequiredError on 402

  return res.json() as Promise<ParseResponse>;
}
