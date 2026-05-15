export type IdeaCardData = {
  title: string;
  body: string;
  days?: number;
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
  resultMd: string;
  ideaCards: IdeaCardData[];
  appliedHypotheses: AppliedHypothesis[];
  createdAt: string;
};

const FAILURE_PREFIX = '⚠️ Анализ не удался';

export const isPendingAnalysis = (a: Analysis): boolean => a.resultMd === '';
export const isFailedAnalysis = (a: Analysis): boolean =>
  a.resultMd.startsWith(FAILURE_PREFIX);

type ServerRow = {
  id: string;
  window_start: string;
  window_end: string;
  result_md: string;
  idea_cards: unknown;
  applied_hypotheses: unknown;
  created_at: string;
};

function asIdeaCards(value: unknown): IdeaCardData[] {
  if (!Array.isArray(value)) return [];
  const out: IdeaCardData[] = [];
  for (const c of value) {
    if (!c || typeof c !== 'object') continue;
    const card = c as Record<string, unknown>;
    if (typeof card.title !== 'string' || typeof card.body !== 'string') continue;
    const idea: IdeaCardData = { title: card.title, body: card.body };
    if (typeof card.days === 'number' && Number.isFinite(card.days)) {
      idea.days = card.days;
    }
    out.push(idea);
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
    resultMd: row.result_md ?? '',
    ideaCards: asIdeaCards(row.idea_cards),
    appliedHypotheses: asAppliedHypotheses(row.applied_hypotheses),
    createdAt: row.created_at,
  };
}
