import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { Hypothesis } from '@/entities/hypothesis';
import HypothesisListItem from './HypothesisListItem';

const HYP: Hypothesis = {
  id: '1',
  title: 'Гипотеза A',
  body: 'Тело гипотезы',
  createdAt: '2026-06-09T00:00:00.000Z',
};

// The edit trigger moved off the row text onto a trailing chevron (plan §4).
// These lock that contract: the chevron is the ONLY edit affordance, it appears
// only when the edit wiring is supplied, and the body text stays inert.
describe('HypothesisListItem edit chevron', () => {
  it('renders the edit chevron (label→edit input) only with onEdit + editInputHtmlFor', () => {
    const { container, rerender } = render(
      <HypothesisListItem hypothesis={HYP} selected={false} onToggle={() => {}} />,
    );
    // No edit wiring → no chevron.
    expect(container.querySelector('label[for="edit-input"]')).toBeNull();

    rerender(
      <HypothesisListItem
        hypothesis={HYP}
        selected={false}
        onToggle={() => {}}
        onEdit={() => {}}
        editInputHtmlFor="edit-input"
      />,
    );
    const chevron = container.querySelector('label[for="edit-input"]');
    expect(chevron).not.toBeNull();
    expect(chevron).toHaveAttribute('aria-label', 'Редактировать гипотезу');
  });

  it('keeps the row text inert — the title is in no label/trigger', () => {
    render(
      <HypothesisListItem
        hypothesis={HYP}
        selected={false}
        onToggle={() => {}}
        onEdit={() => {}}
        editInputHtmlFor="edit-input"
      />,
    );
    // Pre-change the whole text was a <label htmlFor> that opened edit; now only
    // the chevron carries it, so the title must sit outside any <label>.
    expect(screen.getByText('Гипотеза A').closest('label')).toBeNull();
  });
});
