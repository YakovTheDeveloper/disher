import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HypothesisListItem from '../HypothesisListItem';
import type { Hypothesis } from '@/entities/hypothesis';

// Deterministic relative date — the real util is wall-clock-dependent.
vi.mock('@/shared/lib/time/relativeTimeRu', () => ({
  relativeTimeRu: () => '2 дня назад',
}));

const H: Hypothesis = {
  id: 'h1',
  title: 'Сон и кофе',
  body: '',
  createdAt: '2026-06-01T00:00:00.000Z',
};

describe('HypothesisListItem «new» marker', () => {
  it('marks a just-created row with data-new', () => {
    const { container } = render(
      <HypothesisListItem hypothesis={H} selected={false} onToggle={() => {}} isNew />,
    );
    expect(container.querySelector('[data-new]')).not.toBeNull();
  });

  it('has no data-new by default', () => {
    const { container } = render(
      <HypothesisListItem hypothesis={H} selected={false} onToggle={() => {}} />,
    );
    expect(container.querySelector('[data-new]')).toBeNull();
  });

  it('composes the new ring with the selected accent', () => {
    const { container } = render(
      <HypothesisListItem hypothesis={H} selected onToggle={() => {}} isNew />,
    );
    const row = container.querySelector('[data-new]');
    expect(row).not.toBeNull();
    expect(row).toHaveAttribute('data-selected');
  });
});

describe('HypothesisListItem meta (relative date)', () => {
  it('renders the date only when showMeta is set (view-first screen)', () => {
    const { queryByText } = render(
      <HypothesisListItem hypothesis={H} selected={false} onToggle={() => {}} showMeta />,
    );
    expect(queryByText('2 дня назад')).not.toBeNull();
  });

  it('hides the date by default (selection lists stay clean)', () => {
    const { queryByText } = render(
      <HypothesisListItem hypothesis={H} selected={false} onToggle={() => {}} />,
    );
    expect(queryByText('2 дня назад')).toBeNull();
  });
});
