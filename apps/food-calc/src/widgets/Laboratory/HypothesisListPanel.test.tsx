import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { Hypothesis } from '@/entities/hypothesis';
import HypothesisListPanel from './HypothesisListPanel';

const HYPS: Hypothesis[] = [
  { id: '1', title: 'Гипотеза A', body: '', createdAt: '2026-06-09T00:00:00.000Z' },
];

// The scrollBody carries the `data-dv` anchor attribute — it is the element
// whose inline maxHeight / flow class encodes the bounded-vs-flow contract.
function scrollBody(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-dv]') as HTMLElement;
}

describe('HypothesisListPanel scroll mode', () => {
  it('caps the body height (bounded inner scroll) by default', () => {
    const { container } = render(
      <HypothesisListPanel
        hypotheses={HYPS}
        selectedIds={new Set()}
        onToggle={() => {}}
        maxBodyHeight="38vh"
      />,
    );
    expect(scrollBody(container).style.maxHeight).toBe('38vh');
  });

  it('flows at natural height (no inner scroll) when maxBodyHeight="none"', () => {
    const { container } = render(
      <HypothesisListPanel
        hypotheses={HYPS}
        selectedIds={new Set()}
        onToggle={() => {}}
        maxBodyHeight="none"
      />,
    );
    // No inline maxHeight — the modal body owns the single scroll container.
    expect(scrollBody(container).style.maxHeight).toBe('');
  });
});
