// Frontend mirror of the backend analysis contract (apps/disher-backend-3.0/
// src/shared/analysis-output.ts). Two distinct output entities, deliberately
// separate:
//   • insight    — read-only observation grounded in real window days
//                  (evidence.days). Cannot be added (yet) — display only.
//   • hypothesis — a testable experiment the user can save to their own
//                  hypothesis list (the former «idea card»).
// `summary` rides in the `result_md` column so its pending('')/failed('⚠️…')
// sentinels keep working.

export type AnalysisStrength = 'weak' | 'moderate' | 'clear';

// Valence — whether the observation is a good combination (synergy, e.g. iron +
// vitamin C) or a bad one (antagonism / поведенческий минус). Orthogonal to
// `strength` (confidence): one says good/bad, the other says how sure. The LLM
// classifies it; 'neutral' is the safe default for a plain observation.
export type AnalysisValence = 'positive' | 'negative' | 'neutral';

export type AnalysisEvidence = {
  days: string[];
  foods?: string[];
  events?: string[];
};

export type AnalysisInsight = {
  title: string;
  detail: string;
  valence: AnalysisValence;
  strength: AnalysisStrength;
  evidence: AnalysisEvidence;
};

export type AnalysisHypothesis = {
  title: string;
  body: string;
  suggestedDays?: number;
};

// Frozen snapshot of a hypothesis the user ticked when starting the analysis.
// Immutable — survives editing or deleting the live hypothesis.
export type AppliedHypothesis = {
  id: string;
  title: string;
  body: string;
};

export type Analysis = {
  id: string;
  windowStart: string;
  windowEnd: string;
  /** Short overview. '' ⇒ pending; '⚠️…'-prefixed ⇒ failed. */
  summary: string;
  insights: AnalysisInsight[];
  hypotheses: AnalysisHypothesis[];
  appliedHypotheses: AppliedHypothesis[];
  createdAt: string;
};

const FAILURE_PREFIX = '⚠️ Анализ не удался';

export const isPendingAnalysis = (a: Analysis): boolean => a.summary === '';
export const isFailedAnalysis = (a: Analysis): boolean =>
  a.summary.startsWith(FAILURE_PREFIX);

type ServerRow = {
  id: string;
  window_start: string;
  window_end: string;
  result_md: string;
  idea_cards: unknown;
  insights: unknown;
  applied_hypotheses: unknown;
  created_at: string;
};

// Permissive coercions — mirror the backend parser. Malformed entries are
// dropped, not crashed on. An insight with neither evidence.days NOR
// evidence.foods is dropped (the grounding gate, same rule as the server):
// pattern insights ground in days, compositional/isolated-food insights
// (synergies/antagonisms) ground in foods, so foods-only is now valid.
function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const s = item.trim();
    if (s) out.push(s);
  }
  return out;
}

export function asInsights(value: unknown): AnalysisInsight[] {
  if (!Array.isArray(value)) return [];
  const out: AnalysisInsight[] = [];
  for (const c of value) {
    if (!c || typeof c !== 'object') continue;
    const o = c as Record<string, unknown>;
    if (typeof o.title !== 'string' || typeof o.detail !== 'string') continue;
    const ev = (o.evidence ?? {}) as Record<string, unknown>;
    const days = asStringList(ev.days);
    const foods = asStringList(ev.foods);
    if (days.length === 0 && foods.length === 0) continue; // grounding gate
    const strength: AnalysisStrength =
      o.strength === 'clear' || o.strength === 'moderate' ? o.strength : 'weak';
    const valence: AnalysisValence =
      o.valence === 'positive' || o.valence === 'negative' ? o.valence : 'neutral';
    const insight: AnalysisInsight = {
      title: o.title,
      detail: o.detail,
      valence,
      strength,
      evidence: { days },
    };
    if (foods.length > 0) insight.evidence.foods = foods;
    const events = asStringList(ev.events);
    if (events.length > 0) insight.evidence.events = events;
    out.push(insight);
  }
  return out;
}

export function asHypotheses(value: unknown): AnalysisHypothesis[] {
  if (!Array.isArray(value)) return [];
  const out: AnalysisHypothesis[] = [];
  for (const c of value) {
    if (!c || typeof c !== 'object') continue;
    const o = c as Record<string, unknown>;
    if (typeof o.title !== 'string' || typeof o.body !== 'string') continue;
    const h: AnalysisHypothesis = { title: o.title, body: o.body };
    // Accept `suggestedDays` (new) or `days` (legacy idea_cards rows).
    const rawDays = o.suggestedDays ?? o.days;
    if (typeof rawDays === 'number' && Number.isFinite(rawDays) && rawDays > 0) {
      h.suggestedDays = rawDays;
    }
    out.push(h);
  }
  return out;
}

// Permissive parse — drop malformed entries, default a missing id to ''.
function asAppliedHypotheses(value: unknown): AppliedHypothesis[] {
  if (!Array.isArray(value)) return [];
  const out: AppliedHypothesis[] = [];
  for (const h of value) {
    if (!h || typeof h !== 'object') continue;
    const row = h as Record<string, unknown>;
    if (typeof row.title !== 'string' || typeof row.body !== 'string') continue;
    out.push({
      id: typeof row.id === 'string' ? row.id : '',
      title: row.title,
      body: row.body,
    });
  }
  return out;
}

export function mapServerAnalysis(row: ServerRow): Analysis {
  return {
    id: row.id,
    windowStart: row.window_start,
    windowEnd: row.window_end,
    summary: row.result_md ?? '',
    insights: asInsights(row.insights),
    hypotheses: asHypotheses(row.idea_cards),
    appliedHypotheses: asAppliedHypotheses(row.applied_hypotheses),
    createdAt: row.created_at,
  };
}

// ─── Derived status ───────────────────────────────────────────────────────

/**
 * A pending row whose job died (backend restart, crash) sits at summary=''
 * forever. After this much wall-clock both the list row and the detail modal
 * stop calling it «идёт» and treat it as «возможно, не удалось» — a
 * client-side heuristic, no extra request.
 */
export const STALE_PENDING_MS = 15 * 60 * 1000;

export type AnalysisRowStatus = 'running' | 'stale' | 'failed' | 'done';

// Single source of truth for the four-way analysis status — used by the list
// row, the detail modal, and useAnalysis() polling so they never disagree
// (a dead job must not poll forever in the modal while the list already
// shows it as stale).
export function deriveStatus(
  a: Analysis,
  now: number = Date.now(),
): AnalysisRowStatus {
  if (isFailedAnalysis(a)) return 'failed';
  if (isPendingAnalysis(a)) {
    const created = Date.parse(a.createdAt);
    if (Number.isNaN(created)) return 'running';
    // Boundary: exactly STALE_PENDING_MS old is still «идёт».
    return now - created > STALE_PENDING_MS ? 'stale' : 'running';
  }
  return 'done';
}
