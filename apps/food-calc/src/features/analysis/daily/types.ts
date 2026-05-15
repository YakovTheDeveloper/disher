import type { IdeaCardData } from '../api';

export type DailyAnalysisStatus =
  | 'streaming'
  | 'done'
  | 'failed'
  | 'interrupted';

// Why the stream stopped — drives the banner subtitle. `null` for
// streaming/done. Without it the two `interrupted` cases (reload vs the user
// switching dates) are indistinguishable on render.
export type DailyAnalysisReason =
  | 'network' // failed: the network dropped
  | 'server' // failed: 5xx / event:error from the server
  | 'reload' // interrupted: the page reloaded mid-stream (boot flip)
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
  resultMd: string;
  ideaCards: IdeaCardData[];
  appliedHypotheses: AppliedHypothesisSnapshot[];
  createdAt: string;
  status: DailyAnalysisStatus;
  reason: DailyAnalysisReason;
};
