import { authedFetch } from '@/shared/lib/api/authedFetch';
import { API_BASE } from '@/shared/lib/api/base';
import { readApiError } from '@/shared/lib/api/apiError';
import {
  asInsights,
  asHypotheses,
  type AnalysisInsight,
  type AnalysisHypothesis,
} from '../api';
import type { NutrientLine } from '../api/runAnalysis';

// Single-request client for POST /api/analyze/daily. The daily flow used to
// consume an SSE markdown stream; it now does one POST and gets back the
// structured {summary, insights, hypotheses} contract (shared with the long
// analysis). The failure-kind discriminator survives — the store needs to know
// network vs server vs payment to pick the banner subtitle.

const ENDPOINT = `${API_BASE}/api/analyze/daily`;

export type DailyStreamErrorKind = 'network' | 'server' | 'payment';

// Name kept (DailyStreamError) so existing store/test imports don't churn,
// even though there is no stream anymore.
export class DailyStreamError extends Error {
  readonly kind: DailyStreamErrorKind;
  constructor(kind: DailyStreamErrorKind, message: string) {
    super(message);
    this.name = 'DailyStreamError';
    this.kind = kind;
  }
}

export type DailyPromptHypothesis = { title: string; body: string };

export type DailyAnalysisOutput = {
  summary: string;
  insights: AnalysisInsight[];
  hypotheses: AnalysisHypothesis[];
};

type RequestArgs = {
  date: string;
  scheduleFoods: unknown[];
  scheduleEvents: unknown[];
  /** Approximate per-day nutrient totals — an anchor for the LLM, not exact. */
  nutrients: NutrientLine[];
  hypotheses: DailyPromptHypothesis[];
  /** Optional free-text «уточнения от пользователя» for this run. */
  userMessage?: string;
  signal: AbortSignal;
};

// Resolve with the parsed structured analysis. Reject with DailyStreamError on
// a genuine network / server / payment failure. An abort (date-switch) rejects
// with an AbortError that the caller filters via `signal.aborted` — same
// contract the store already relied on.
export async function requestDailyAnalysis(
  args: RequestArgs,
): Promise<DailyAnalysisOutput> {
  const {
    date,
    scheduleFoods,
    scheduleEvents,
    nutrients,
    hypotheses,
    userMessage,
    signal,
  } = args;

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
    if (signal.aborted) throw err; // store checks signal.aborted and bails quietly
    throw new DailyStreamError(
      'network',
      err instanceof Error ? err.message : String(err),
    );
  }

  // Any non-ok HTTP response (4xx auth/validation, 402 payment, 5xx) — surface
  // with the right kind. readApiError carries the localized RU message for 402.
  if (!res.ok) {
    const e = await readApiError(res);
    throw new DailyStreamError(e.paymentRequired ? 'payment' : 'server', e.message);
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch (err) {
    if (signal.aborted) throw err;
    throw new DailyStreamError(
      'server',
      err instanceof Error ? err.message : String(err),
    );
  }

  const analysis = (body as { analysis?: unknown })?.analysis as
    | Record<string, unknown>
    | undefined;
  if (!analysis || typeof analysis.summary !== 'string') {
    throw new DailyStreamError('server', 'Некорректный ответ сервера');
  }

  return {
    summary: analysis.summary,
    insights: asInsights(analysis.insights),
    hypotheses: asHypotheses(analysis.hypotheses),
  };
}
