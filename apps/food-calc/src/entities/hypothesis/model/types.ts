// A hypothesis the user wants to check, attached to an analysis via checkbox.
// Simplified 2026-05-15: no lifecycle (saved/testing/closed), no dates, no
// outcome, no private note, no source-analysis link — just title + body.
export interface Hypothesis {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}
