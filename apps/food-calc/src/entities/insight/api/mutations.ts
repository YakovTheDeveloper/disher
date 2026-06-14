import { db, type InsightRow } from '@/shared/lib/dexie/schema';
import { putRow, deleteRow } from '@/shared/lib/dexie/write';
import type {
  InsightValence,
  InsightStrength,
  InsightSource,
  InsightEvidence,
} from '../model/types';

const now = () => new Date().toISOString();

// Save an insight produced by an analysis. There is no `updateInsight`: an
// insight is read-only after it lands (only the LLM authors it; the user can
// delete but not edit). The input is structural so the caller can pass an
// AnalysisInsight (features layer) without an upward type import.
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

export async function deleteInsight(id: string): Promise<void> {
  await deleteRow(db.insights, id);
}
