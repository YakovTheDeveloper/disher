// Pure mapping from the clarification modal's UI state to daily-analysis
// start() args. Extracted (own file, not beside the component) so it stays
// Fast-Refresh-safe and unit-testable without rendering Base UI / Dexie.
//
// - hypothesisIds: only ticked ids that are still in the live list (a
//   hypothesis deleted mid-modal drops out), in live-list order.
// - userMessage: trimmed; empty/whitespace-only → undefined (omitted from the
//   POST body / prompt entirely).
export function buildStartArgs(
  hypotheses: ReadonlyArray<{ id: string }>,
  selectedIds: ReadonlySet<string>,
  message: string,
): { hypothesisIds: string[]; userMessage?: string } {
  const hypothesisIds = hypotheses
    .filter((h) => selectedIds.has(h.id))
    .map((h) => h.id);
  const trimmed = message.trim();
  return { hypothesisIds, userMessage: trimmed || undefined };
}
