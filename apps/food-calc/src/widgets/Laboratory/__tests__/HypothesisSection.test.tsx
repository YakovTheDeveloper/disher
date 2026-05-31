import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HypothesisSection from '../HypothesisSection';
import { saveHypothesis } from '@/entities/hypothesis';
import type { Hypothesis } from '@/entities/hypothesis';

vi.mock('@/entities/hypothesis', () => ({ saveHypothesis: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
// Isolate from the design-variant store / IntersectionObserver. Mirror the
// real anchor shape — it always carries a `ref` callback, which the panel now
// merges with its scroll-reset ref.
vi.mock('@/shared/lib/useDesignVariant', () => ({
  useDesignVariant: () => ({
    variant: 'lavender',
    anchor: { ref: () => {}, 'data-dv': 'LabHypothesis', 'data-dv-v': 'lavender' },
  }),
}));

const mockedSave = vi.mocked(saveHypothesis);
const LIST: Hypothesis[] = [
  { id: 'h1', title: 'Сон и кофе', body: '', createdAt: '2026-06-01T00:00:00.000Z' },
];

describe('HypothesisSection — ephemeral «new» marker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rings the just-created row; a fresh mount shows no ring', async () => {
    // saveHypothesis resolves to an id already present in the list, so the
    // marked row is one we can find (the live list is a static prop here).
    mockedSave.mockResolvedValue('h1');

    const { unmount } = render(<HypothesisSection hypotheses={LIST} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Сон и кофе' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }));

    await waitFor(() =>
      expect(document.querySelector('[data-new]')).not.toBeNull(),
    );

    // Leaving the screen (unmount) drops the in-memory newIds — remounting
    // with the same list shows the row without the ring.
    unmount();
    render(<HypothesisSection hypotheses={LIST} />);
    expect(document.querySelector('[data-new]')).toBeNull();
    expect(screen.getByText('Сон и кофе')).toBeInTheDocument();
  });
});
