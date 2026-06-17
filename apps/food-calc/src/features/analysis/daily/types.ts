import type {
  AnalysisObservation,
  AnalysisInsight,
  AnalysisHypothesis,
} from '../api';

export type DailyAnalysisStatus =
  | 'loading'
  | 'done'
  | 'failed'
  | 'interrupted';

// Why the request stopped — drives the banner subtitle. `null` for
// loading/done. Without it the two `interrupted` cases (reload vs the user
// switching dates) are indistinguishable on render.
export type DailyAnalysisReason =
  | 'network' // failed: the network dropped
  | 'server' // failed: 5xx / parse error from the server
  | 'payment' // failed: 402 — wallet can't cover the price
  | 'reload' // interrupted: the page reloaded mid-request (boot flip)
  | 'date-switch' // interrupted: the user switched away from the date
  | null;

// Frozen snapshot of a hypothesis ticked when the daily analysis started.
// `id` is bookkeeping (future link to the live hypothesis); only {title,body}
// are ever projected into the LLM prompt.
export type AppliedHypothesisSnapshot = {
  id: string;
  title: string;
  body: string;
};

export type DailyAnalysis = {
  /** dd-MM-yyyy — primary key. One analysis per date; a re-run replaces it. */
  date: string;
  /** Short overview (markdown). Empty while loading / on failure. */
  summary: string;
  observations: AnalysisObservation[];
  insights: AnalysisInsight[];
  hypotheses: AnalysisHypothesis[];
  appliedHypotheses: AppliedHypothesisSnapshot[];
  /** Free-text «уточнения от пользователя» the run was started with, so a retry
   *  reproduces the same prompt. Undefined when none was provided. */
  appliedUserMessage?: string;
  createdAt: string;
  status: DailyAnalysisStatus;
  reason: DailyAnalysisReason;
};
