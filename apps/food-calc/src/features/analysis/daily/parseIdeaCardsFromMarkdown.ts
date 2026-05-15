import type { IdeaCardData } from '../api';

// Client-side parser for the `## Идеи для эксперимента` tail of a daily
// analysis. The daily endpoint streams plain markdown (no JSON contract), so
// idea-cards are extracted from the text rather than a structured field.
//
// Lenient by design — a missing or malformed section yields `[]` and the
// analysis text still renders (graceful fallback). Reuses `IdeaCardData` so
// there is no third idea-card type next to the backend `IdeaCard`.

const HEADING_RE = /^#{1,6}\s+/;
const BULLET_RE = /^\s*[-*]\s+(.*)$/;
// `- **Title** — body`. The non-greedy group inside `**…**` lets the title
// itself contain a dash (`**Кофе — да или нет** — …`) — the split happens on
// the dash that follows the CLOSING `**`, not the first dash in the line.
const BOLD_RE = /^\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/;
// Bold-less fallback: split on a spaced em/en dash. Plain hyphens are left
// alone — they occur inside words and would mis-split the title.
const PLAIN_SPLIT_RE = /^(.+?)\s+[—–]\s+(.+)$/;

export function parseIdeaCardsFromMarkdown(markdown: string): IdeaCardData[] {
  if (!markdown) return [];
  const lines = markdown.split('\n');

  // Find the ideas heading. Lenient: any heading line mentioning «иде…» —
  // tolerates `## Идеи`, `### Идеи для эксперимента`, a stray position, etc.
  let headingIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (HEADING_RE.test(lines[i]) && /иде[ия]/i.test(lines[i])) {
      headingIdx = i;
      break;
    }
  }
  if (headingIdx === -1) return [];

  const cards: IdeaCardData[] = [];
  for (let i = headingIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (HEADING_RE.test(line)) break; // a new section ends the ideas block

    const bullet = line.match(BULLET_RE);
    if (!bullet) continue;
    const content = bullet[1].trim();
    if (!content) continue;

    const bold = content.match(BOLD_RE);
    if (bold) {
      const title = bold[1].trim();
      const body = bold[2].trim();
      if (title) cards.push({ title, body });
      continue;
    }

    const plain = content.match(PLAIN_SPLIT_RE);
    if (plain) {
      const title = plain[1].replace(/\*\*/g, '').trim();
      const body = plain[2].replace(/\*\*/g, '').trim();
      if (title) cards.push({ title, body });
      continue;
    }

    // No separator at all — treat the whole bullet as the title.
    const title = content.replace(/\*\*/g, '').trim();
    if (title) cards.push({ title, body: '' });
  }

  return cards;
}
