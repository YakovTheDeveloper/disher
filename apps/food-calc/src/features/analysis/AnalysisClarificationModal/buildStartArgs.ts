import type { ActiveHypothesisContext } from '../api';

// Pure mapping from the clarification modal's UI state to daily startAnalysis()
// args. Extracted (own file, not beside the component) so it stays
// Fast-Refresh-safe and unit-testable without rendering Base UI / Dexie.
//
// - hypotheses: only ticked ids still in the live list (a hypothesis deleted
//   mid-modal drops out), in live-list order, snapshotted to {id,title,body}
//   for the applied_hypotheses jsonb — same shape the weekly flow sends.
// - userMessage: trimmed; empty/whitespace-only → undefined (omitted from the
//   POST body / prompt entirely).
export function buildStartArgs(
  hypotheses: ReadonlyArray<{ id: string; title: string; body: string }>,
  selectedIds: ReadonlySet<string>,
  message: string,
): { hypotheses: ActiveHypothesisContext[]; userMessage?: string } {
  const snapshot = hypotheses
    .filter((h) => selectedIds.has(h.id))
    .map((h) => ({ id: h.id, title: h.title, body: h.body }));
  const trimmed = message.trim();
  return { hypotheses: snapshot, userMessage: trimmed || undefined };
}
