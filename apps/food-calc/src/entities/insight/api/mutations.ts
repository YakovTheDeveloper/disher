import { db, type InsightRow } from '@/shared/lib/dexie/schema';
import { putRow, updateRow, deleteRow } from '@/shared/lib/dexie/write';
import type {
  InsightValence,
  InsightStrength,
  InsightSource,
  InsightEvidence,
} from '../model/types';

const now = () => new Date().toISOString();

// Save an insight produced by an analysis. The input is structural so the caller
// can pass an AnalysisInsight (features layer) without an upward type import.
// The LLM authors valence/strength/evidence; the user may later refine the
// title/detail via `updateInsight` (edit chevron on the saved card, 2026-07-04).
export async function saveInsight(input: {
  title: string;
  detail: string;
  valence: InsightValence;
  strength: InsightStrength;
  evidence: InsightEvidence;
  source: InsightSource;
}): Promise<string> {
  const id = crypto.randomUUID();
  const evidence: Record<string, unknown> = { days: input.evidence.days };
  if (input.evidence.foods?.length) evidence.foods = input.evidence.foods;
  if (input.evidence.events?.length) evidence.events = input.evidence.events;
  const row: Omit<InsightRow, 'updated_at'> = {
    id,
    title: input.title,
    detail: input.detail,
    valence: input.valence,
    strength: input.strength,
    evidence,
    source: input.source,
    created_at: now(),
  };
  await putRow(db.insights, row);
  return id;
}

// User refinement of a saved insight — only the free-text title/detail are
// editable (valence/strength/evidence stay as the LLM classified them). Mirrors
// updateHypothesis: patch only the provided fields, re-stamp updated_at.
export async function updateInsight(
  id: string,
  patch: { title?: string; detail?: string },
): Promise<void> {
  const changes: Partial<InsightRow> = {};
  if (patch.title !== undefined) changes.title = patch.title;
  if (patch.detail !== undefined) changes.detail = patch.detail;
  if (Object.keys(changes).length > 0) await updateRow(db.insights, id, changes);
}

export async function deleteInsight(id: string): Promise<void> {
  await deleteRow(db.insights, id);
}
