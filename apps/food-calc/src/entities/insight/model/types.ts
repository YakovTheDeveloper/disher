// An insight the user saved from an analysis result. Read-only after save —
// it only ever enters the list from an LLM answer («Сохранить»), never
// authored by hand (that's the difference from a hypothesis). The union types
// are duplicated here rather than imported from features/analysis: the entity
// layer sits BELOW features and must not import upward.

export type InsightValence = 'positive' | 'negative' | 'neutral';
export type InsightStrength = 'weak' | 'moderate' | 'clear';
/** Which разбор produced the insight — bookkeeping (no UI grouping yet). */
export type InsightSource = 'daily' | 'dish' | 'long';

export interface InsightEvidence {
  days: string[];
  foods?: string[];
  events?: string[];
}

// The display core of an insight — exactly the fields a card renders. Both the
// analysis-result insight (features/analysis `AnalysisInsight`) and the
// persisted `Insight` below conform to it, so `InsightCard` types its prop as
// `InsightCore`: the saved-list path (InsightListPanel passes `Insight`) is
// guaranteed by `extends`, and the result path (AnalysisResult passes
// `AnalysisInsight`) is structurally checked — a field rename on either side
// breaks at the seam instead of slipping through.
export interface InsightCore {
  title: string;
  detail: string;
  valence: InsightValence;
  strength: InsightStrength;
  evidence: InsightEvidence;
}

export interface Insight extends InsightCore {
  id: string;
  source: InsightSource;
  createdAt: string;
}
