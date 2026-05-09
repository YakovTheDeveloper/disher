import { db, type HypothesisRow } from '@/shared/lib/dexie/schema';

const now = () => new Date().toISOString();

export type SaveHypothesisInput = {
  title: string;
  body: string;
  days?: number | null;
  sourceAnalysisId?: string | null;
  note?: string | null;
  /** Set to true when the user clicked "Тестирую сейчас". */
  startNow?: boolean;
};

export async function saveHypothesis(input: SaveHypothesisInput): Promise<string> {
  const id = crypto.randomUUID();
  const stamped = now();
  const row: HypothesisRow = {
    id,
    title: input.title,
    body: input.body,
    days: input.days ?? null,
    source_analysis_id: input.sourceAnalysisId ?? null,
    saved_at: stamped,
    started_at: input.startNow ? stamped : null,
    ended_at: null,
    outcome: null,
    note: input.note ?? null,
    created_at: stamped,
  };
  await db.hypotheses.add(row);
  return id;
}

export async function startTestingHypothesis(id: string): Promise<void> {
  await db.hypotheses.update(id, { started_at: now() });
}

export async function closeHypothesis(
  id: string,
  outcome: string,
): Promise<void> {
  await db.hypotheses.update(id, {
    ended_at: now(),
    outcome: outcome.trim() || null,
  });
}

export async function updateHypothesisNote(
  id: string,
  note: string,
): Promise<void> {
  await db.hypotheses.update(id, { note: note.trim() || null });
}

export async function deleteHypothesis(id: string): Promise<void> {
  await db.hypotheses.delete(id);
}
