import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { db } from '@/shared/lib/dexie/schema';
import { saveInsight } from '@/entities/insight';
import InsightsSlide from './InsightsSlide';

// <Screen> mounts useScrollBottomIndicator, which constructs an IntersectionObserver
// — absent in jsdom. Stub it to a no-op so the slide renders (the scroll indicator
// is irrelevant to focus delegation).
beforeAll(() => {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    IntersectionObserverStub;
  // The expand path schedules an iOS scrollIntoView (300ms) on the title input;
  // jsdom has no layout, so stub it to a no-op or the timer throws post-test.
  Element.prototype.scrollIntoView = () => {};
});

// The edit flow here is label-focus delegation (CLAUDE.md «don't unmount the
// label on click»): clicking the card chevron sets editingInsightId, but the
// STEP flips only when the modal's title input actually receives focus, caught by
// `onFocusCapture` on the container. The guard is `id === EDIT_INSIGHT_TITLE_INPUT_ID`.
// This test locks that predicate: focusing the title input expands the modal
// (its «Сохранить» action button is gated behind isExpanded), focusing any other
// input does not. A regression (wrong id, or a synchronous setStep in the click)
// is invisible to assembly/type checks.
afterEach(async () => {
  await db.insights.clear();
  await db.tombstones.clear();
});

async function seedInsight() {
  await saveInsight({
    title: 'Молочка → голова',
    detail: 'описание',
    valence: 'negative',
    strength: 'moderate',
    evidence: { days: ['13-06-2026'], foods: ['молоко'] },
    source: 'daily',
  });
}

describe('InsightsSlide edit focus-delegation', () => {
  it('focusing the title input expands the edit modal (step → edit)', async () => {
    await seedInsight();
    render(<InsightsSlide topSlot={null} />);

    // Wait for the saved insight to hydrate from Dexie into a card.
    await screen.findByText('Молочка → голова');

    // Collapsed: the modal's finish action button is gated behind isExpanded.
    // Its accessible name is «Готово» — ModalNextButton variant="finish" hardcodes
    // aria-label 'Готово' (the visible label is «Сохранить»). It exists ONLY once
    // the modal expands, so it's a clean signal that editStep flipped.
    expect(screen.queryByRole('button', { name: 'Готово' })).not.toBeInTheDocument();

    const titleInput = document.getElementById('edit-insight-title');
    expect(titleInput).toBeTruthy();
    // React's onFocus/onFocusCapture listens to the native capture-phase `focus`
    // (focus doesn't bubble → focusIn would NOT reach the handler here).
    fireEvent.focus(titleInput!);

    // onFocusCapture matched the id → editStep='edit' → ActionButtons render.
    expect(await screen.findByRole('button', { name: 'Готово' })).toBeInTheDocument();
  });

  it('focusing a non-title input does NOT expand the modal (id guard)', async () => {
    await seedInsight();
    render(<InsightsSlide topSlot={null} />);
    await screen.findByText('Молочка → голова');

    const detailInput = document.getElementById('edit-insight-detail');
    expect(detailInput).toBeTruthy();
    fireEvent.focus(detailInput!);

    // id !== EDIT_INSIGHT_TITLE_INPUT_ID → step stays idle → no finish button.
    expect(screen.queryByRole('button', { name: 'Готово' })).not.toBeInTheDocument();
  });
});
