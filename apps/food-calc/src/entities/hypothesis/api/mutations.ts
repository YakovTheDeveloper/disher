import { db, type HypothesisRow } from '@/shared/lib/dexie/schema';
import { putRow, updateRow, deleteRow } from '@/shared/lib/dexie/write';

const now = () => new Date().toISOString();

export async function saveHypothesis(input: {
  title: string;
  body: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  const row: Omit<HypothesisRow, 'updated_at'> = {
    id,
    title: input.title,
    body: input.body,
    created_at: now(),
  };
  await putRow(db.hypotheses, row);
  return id;
}

export async function updateHypothesis(
  id: string,
  patch: { title?: string; body?: string },
): Promise<void> {
  const changes: Partial<HypothesisRow> = {};
  if (patch.title !== undefined) changes.title = patch.title;
  if (patch.body !== undefined) changes.body = patch.body;
  if (Object.keys(changes).length > 0) await updateRow(db.hypotheses, id, changes);
}

export async function deleteHypothesis(id: string): Promise<void> {
  await deleteRow(db.hypotheses, id);
}
