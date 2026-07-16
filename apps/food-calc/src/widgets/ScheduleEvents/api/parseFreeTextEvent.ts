import { API_BASE } from '@/shared/lib/api/base';
import { authedFetch } from '@/shared/lib/api/authedFetch';
import { throwApiError } from '@/shared/lib/api/apiError';

export interface ParsedAspect {
  label: string;
  value: number;
}

export interface ParsedEvent {
  /** Free-text description (без времени и числовых оценок — они в отдельных полях). */
  text: string;
  /** "HH:MM" | null — начало периода или момент события. */
  timeStart: string | null;
  /** "HH:MM" | null — конец периода (только если событие — интервал). */
  timeEnd: string | null;
  aspects: ParsedAspect[];
}

export interface ParseEventsResponse {
  requestId: string;
  events: ParsedEvent[];
}

// `requestId` — идемпотентный X-Request-Id: сервер дедуплицирует списание
// (user, charge, request_id). Caller обязан ПЕРЕИСПОЛЬЗОВАТЬ его при повторе
// того же логического разбора (retry по той же строке), иначе повторный запрос
// спишет второй раз. Зеркалит parseFreeTextFood.
export async function parseFreeTextEvent(
  text: string,
  requestId: string,
  signal?: AbortSignal,
): Promise<ParseEventsResponse> {
  const res = await authedFetch(`${API_BASE}/api/free-text-event/parse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Request-Id': requestId,
    },
    body: JSON.stringify({ text }),
    signal,
  });

  if (!res.ok) await throwApiError(res); // throws PaymentRequiredError on 402

  return res.json() as Promise<ParseEventsResponse>;
}
