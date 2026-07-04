import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { InsightCard, HypothesisCard } from './';

// These cover the CARD CONTRACT the type-checker can't see: which affordance a
// variant shows (Save button vs edit chevron), how «сила связи» encodes its
// level (bar aria-label), and that an observation (InsightCard minus valence) is
// read-only — no valence sign, no Save. The strength level lives in the bars'
// `title`/`aria-label`, so `getByTitle` reads it without touching hashed classes.

describe('InsightCard', () => {
  it('not-added with onAdd shows the Save button, strength bars and valence sign', () => {
    render(
      <InsightCard
        variant="not-added"
        title="Молочка → голова"
        detail="описание"
        valence="positive"
        strength="clear"
        evidence={{ days: ['13-06-2026'], foods: ['молоко'] }}
        onAdd={async () => {}}
      />,
    );
    expect(screen.getByText('Молочка → голова')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeInTheDocument();
    expect(screen.getByTitle('явная связь')).toBeInTheDocument(); // strength=clear
    expect(screen.getByText('+')).toBeInTheDocument(); // valence=positive → монохром ＋
  });

  it('encodes the strength level in the bars (weak / moderate / clear)', () => {
    const { rerender } = render(
      <InsightCard variant="not-added" title="t" strength="weak" onAdd={async () => {}} />,
    );
    expect(screen.getByTitle('слабая связь')).toBeInTheDocument();

    rerender(
      <InsightCard variant="not-added" title="t" strength="moderate" onAdd={async () => {}} />,
    );
    expect(screen.getByTitle('есть связь')).toBeInTheDocument();

    rerender(
      <InsightCard variant="not-added" title="t" strength="clear" onAdd={async () => {}} />,
    );
    expect(screen.getByTitle('явная связь')).toBeInTheDocument();
  });

  it('added variant shows the edit chevron, not the Save button', () => {
    const { container } = render(
      <InsightCard
        variant="added"
        title="t"
        valence="negative"
        strength="moderate"
        evidence={{ days: [] }}
        onEdit={() => {}}
        editInputHtmlFor="edit-insight-title"
      />,
    );
    expect(container.querySelector('[aria-label="Редактировать инсайт"]')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Сохранить' })).not.toBeInTheDocument();
  });

  it('observation (no valence, no onAdd) is read-only: strength stays, no sign, no Save', () => {
    render(
      <InsightCard
        variant="not-added"
        title="паттерн"
        strength="moderate"
        evidence={{ days: ['13-06-2026'] }}
      />,
    );
    expect(screen.getByTitle('есть связь')).toBeInTheDocument();
    expect(screen.queryByText('+')).not.toBeInTheDocument();
    expect(screen.queryByText('−')).not.toBeInTheDocument(); // U+2212, VALENCE_SIGN.negative
    expect(screen.queryByRole('button', { name: 'Сохранить' })).not.toBeInTheDocument();
  });
});

describe('HypothesisCard', () => {
  it('not-added shows the «проверить ~N дн.» caption and the Save button', () => {
    render(
      <HypothesisCard
        variant="not-added"
        title="Сон и кофе"
        body="тело"
        suggestedDays={5}
        onAdd={async () => {}}
      />,
    );
    expect(screen.getByText('проверить ~5 дн.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeInTheDocument();
  });

  it('added shows the relative-date meta + edit chevron, no Save button', () => {
    const { container } = render(
      <HypothesisCard
        variant="added"
        title="Сон и кофе"
        meta="2 дня назад"
        onEdit={() => {}}
        editInputHtmlFor="edit-hypothesis-title"
      />,
    );
    expect(screen.getByText('2 дня назад')).toBeInTheDocument();
    expect(container.querySelector('[aria-label="Редактировать гипотезу"]')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Сохранить' })).not.toBeInTheDocument();
  });
});
