import { describe, expect, it } from 'vitest';
import { parseIdeaCardsFromMarkdown } from '../parseIdeaCardsFromMarkdown';

const BODY = `Сегодня был неплохой день.

Утром овсянка, вечером поздний ужин.`;

describe('parseIdeaCardsFromMarkdown', () => {
  it('parses the canonical `- **Title** — body` format', () => {
    const md = `${BODY}

## Идеи для эксперимента

- **Ранний ужин** — попробуй ужинать до 19:00 несколько дней
- **Меньше кофе** — убери вторую чашку и посмотри на сон`;
    expect(parseIdeaCardsFromMarkdown(md)).toEqual([
      {
        title: 'Ранний ужин',
        body: 'попробуй ужинать до 19:00 несколько дней',
      },
      { title: 'Меньше кофе', body: 'убери вторую чашку и посмотри на сон' },
    ]);
  });

  it('does not split a title that itself contains an em-dash', () => {
    const md = `## Идеи для эксперимента

- **Кофе — да или нет** — день с кофе и день без`;
    expect(parseIdeaCardsFromMarkdown(md)).toEqual([
      { title: 'Кофе — да или нет', body: 'день с кофе и день без' },
    ]);
  });

  it('falls back to a dash split when bold markers are missing', () => {
    const md = `## Идеи

- Ранний ужин — попробуй до 19:00`;
    expect(parseIdeaCardsFromMarkdown(md)).toEqual([
      { title: 'Ранний ужин', body: 'попробуй до 19:00' },
    ]);
  });

  it('treats a separator-less bullet as a title-only card', () => {
    const md = `## Идеи для эксперимента

- Просто наблюдение без описания`;
    expect(parseIdeaCardsFromMarkdown(md)).toEqual([
      { title: 'Просто наблюдение без описания', body: '' },
    ]);
  });

  it('returns [] when no ideas section is present', () => {
    expect(parseIdeaCardsFromMarkdown(BODY)).toEqual([]);
    expect(parseIdeaCardsFromMarkdown('')).toEqual([]);
  });

  it('finds the section even when it is not at the very end', () => {
    const md = `## Идеи для эксперимента

- **Идея** — описание

## Послесловие

ещё немного текста`;
    expect(parseIdeaCardsFromMarkdown(md)).toEqual([
      { title: 'Идея', body: 'описание' },
    ]);
  });

  it('stops collecting bullets at the next heading', () => {
    const md = `## Идеи

- **Первая** — да

## Другое

- Этот буллет не идея`;
    const cards = parseIdeaCardsFromMarkdown(md);
    expect(cards).toEqual([{ title: 'Первая', body: 'да' }]);
  });

  it('handles more than 3 bullets without choking', () => {
    const md = `## Идеи для эксперимента

- **A** — a
- **B** — b
- **C** — c
- **D** — d`;
    expect(parseIdeaCardsFromMarkdown(md)).toHaveLength(4);
  });
});
