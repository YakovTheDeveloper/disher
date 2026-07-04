// Lead-paragraph preview of an analysis summary (markdown) for the list-card
// body. The summary can open with a markdown heading line (`## …`) and carry
// inline emphasis / links — skip a leading heading-only line, strip the
// lightweight markdown, and return the lead paragraph. The card clamps it to 2
// lines via CSS.
//
// No sentence-splitting on purpose (decision 2026-07-04): a naive `.`-split
// mis-fires on «80 г.» / «т.д.» / «т.е.» — common in nutrition prose — and would
// truncate mid-thought. The 2-line CSS clamp gives a cleaner, unambiguous preview.

// `[text](url)` → `text`; then drop inline emphasis / code marks.
const stripInline = (s: string): string =>
  s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`~]+/g, '');

export function summaryLead(summary: string): string {
  const lines = summary.split('\n');
  // First non-empty line that isn't a pure markdown heading — the lead paragraph.
  // A summary opening with `## Разбор недели` skips to the body prose.
  let paragraph = '';
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    paragraph = line;
    break;
  }
  // Whole summary was headings/blank — fall back to the first non-empty line.
  if (!paragraph) {
    paragraph = (lines.find((l) => l.trim()) ?? '').trim();
  }
  return stripInline(paragraph).replace(/^#+\s*/, '').trim();
}
