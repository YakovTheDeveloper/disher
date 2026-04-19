import { API_BASE } from '@/shared/lib/api/base';

export interface MatchCandidate {
  id: string;
  name: string;
  score: number;
}

export interface ResolvedItem {
  productId: string;
  name: string;
  originalName: string;
  note: string;
  quantity: number;
  time: string;
  confidence: number;
  quantityGuessed?: boolean;
}

export interface AmbiguousItem {
  originalName: string;
  note: string;
  quantity: number;
  time: string;
  candidates: MatchCandidate[];
  quantityGuessed?: boolean;
}

export interface UnresolvedItem {
  originalName: string;
  note: string;
  quantity: number;
  time: string;
  quantityGuessed?: boolean;
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
  const res = await fetch(`${API_BASE}/api/free-text-food/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ text }),
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
