import { authedFetch } from '@/shared/lib/api/authedFetch';
import { API_BASE } from '@/shared/lib/api/base';
import { readApiError } from '@/shared/lib/api/apiError';
import { createSSEParser } from '@/shared/lib/sse/parseSSELines';
import type { NutrientLine } from '../api/runAnalysis';

// SSE consumer for POST /api/analyze/daily. Mirrors streamDishAnalysis but
// adds a failure-kind discriminator: the daily store needs to know whether a
// failure was a network drop or a server error to pick the banner subtitle.
//
// Abort handling: when the store aborts the stream (date-switch), fetch /
// reader.read() throw an AbortError. That is NOT a failure — the store has
// already set `interrupted`. So on `signal.aborted` we return the partial
// text quietly; only genuine errors throw.

const ENDPOINT = `${API_BASE}/api/analyze/daily`;

export type DailyStreamErrorKind = 'network' | 'server' | 'payment';

export class DailyStreamError extends Error {
  readonly kind: DailyStreamErrorKind;
  constructor(kind: DailyStreamErrorKind, message: string) {
    super(message);
    this.name = 'DailyStreamError';
    this.kind = kind;
  }
}

export type DailyPromptHypothesis = { title: string; body: string };

type StreamArgs = {
  date: string;
  scheduleFoods: unknown[];
  scheduleEvents: unknown[];
  /** Approximate per-day nutrient totals — an anchor for the LLM, not exact. */
  nutrients: NutrientLine[];
  hypotheses: DailyPromptHypothesis[];
  /** Optional free-text «уточнения от пользователя» for this run. */
  userMessage?: string;
  onChunk: (chunk: string) => void;
  signal: AbortSignal;
};

// Stream the daily analysis. Resolves with the full accumulated markdown on
// success OR on abort (caller checks `signal.aborted` to tell them apart).
// Rejects with DailyStreamError on a genuine network/server failure.
export async function streamDailyAnalysis(args: StreamArgs): Promise<string> {
  const {
    date,
    scheduleFoods,
    scheduleEvents,
    nutrients,
    hypotheses,
    userMessage,
    onChunk,
    signal,
  } = args;

  let accumulated = '';
  const collect = (chunk: string) => {
    accumulated += chunk;
    onChunk(chunk);
  };

  let res: Response;
  try {
    res = await authedFetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': crypto.randomUUID(),
      },
      body: JSON.stringify({
        date,
        scheduleFoods,
        scheduleEvents,
        nutrients,
        hypotheses,
        userMessage,
      }),
      signal,
    });
  } catch (err) {
    if (signal.aborted) return accumulated;
    throw new DailyStreamError(
      'network',
      err instanceof Error ? err.message : String(err),
    );
  }

  // Any non-ok HTTP response (4xx auth/validation, 402 payment, 5xx) — surface
  // as `server`. readApiError carries the localized RU message for 402.
  if (!res.ok) {
    const e = await readApiError(res);
    throw new DailyStreamError(e.paymentRequired ? 'payment' : 'server', e.message);
  }

  const parser = createSSEParser(collect);

  // iOS Safari sometimes lacks ReadableStream on fetch responses — fall back
  // to a single text() read.
  if (!res.body) {
    const text = await res.text();
    if (signal.aborted) return accumulated;
    const fed = parser.feed(text);
    if (fed.error) throw new DailyStreamError('server', fed.error);
    const flushed = parser.end();
    if (flushed.error) throw new DailyStreamError('server', flushed.error);
    return accumulated;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      let chunk: ReadableStreamReadResult<Uint8Array>;
      try {
        chunk = await reader.read();
      } catch (err) {
        if (signal.aborted) return accumulated;
        throw new DailyStreamError(
          'network',
          err instanceof Error ? err.message : String(err),
        );
      }
      if (chunk.done) break;
      if (signal.aborted) return accumulated;

      const result = parser.feed(decoder.decode(chunk.value, { stream: true }));
      if (result.error) throw new DailyStreamError('server', result.error);
      if (result.done) return accumulated;
    }
    const tail = parser.end();
    if (tail.error) throw new DailyStreamError('server', tail.error);
  } finally {
    reader.releaseLock();
  }

  return accumulated;
}
