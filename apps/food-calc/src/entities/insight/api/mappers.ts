import type { InsightRow } from '@/shared/lib/dexie/schema';
import type { Insight, InsightEvidence } from '../model/types';

// `evidence` is stored as a parsed object (jsonb-like). Read it back
// defensively: a stale/partial row may miss arrays, so default to a sound
// shape (days [] + drop empty optional lists) the InsightCard can render.
function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === 'string');
}

function mapEvidence(raw: unknown): InsightEvidence {
  const ev = (raw ?? {}) as Record<string, unknown>;
  const evidence: InsightEvidence = { days: asStringList(ev.days) };
  const foods = asStringList(ev.foods);
  if (foods.length > 0) evidence.foods = foods;
  const events = asStringList(ev.events);
  if (events.length > 0) evidence.events = events;
  return evidence;
}

export function mapInsightRow(row: InsightRow): Insight {
  return {
    id: row.id,
    title: row.title,
    detail: row.detail,
    valence: row.valence,
    strength: row.strength,
    evidence: mapEvidence(row.evidence),
    source: row.source,
    createdAt: row.created_at,
  };
}
