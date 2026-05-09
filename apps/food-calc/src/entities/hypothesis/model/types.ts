export interface Hypothesis {
  id: string;
  title: string;
  body: string;
  /** Suggested test duration in days. */
  days: number | null;
  /** The analysis row this hypothesis was surfaced from (no FK). */
  sourceAnalysisId: string | null;
  savedAt: string;
  /** Set when the user clicks "Тестирую сейчас". */
  startedAt: string | null;
  endedAt: string | null;
  /** Free-text outcome the user typed when closing. */
  outcome: string | null;
  note: string | null;
  createdAt: string;
}

/** Status flags derived from started_at / ended_at. */
export type HypothesisStatus = 'saved' | 'testing' | 'closed';

export function hypothesisStatus(h: Hypothesis): HypothesisStatus {
  if (h.endedAt) return 'closed';
  if (h.startedAt) return 'testing';
  return 'saved';
}
