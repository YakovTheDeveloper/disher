import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { drawerStore } from '@/shared/ui';
import type { Insight } from '@/entities/insight';
import InsightListPanel from './InsightListPanel';

// Stub InsightCard to an inert node: this test is about the PANEL's confirm gate
// (does it await ConfirmDrawer before calling onDelete?), not the card's
// rendering — stubbing also keeps the real card's svg/toast imports out of the
// unit. Deletion is a sustained press on the surrounding LongPressRow (Slice 3,
// 2026-06-26), so the gesture is driven on the row, not on the card.
vi.mock('../AnalysisCard', () => ({
  InsightCard: ({ title }: { title: string }) => <div>{title}</div>,
}));

const INSIGHT: Insight = {
  id: 'i1',
  title: 'Молочка → головная боль',
  detail: 'В дни с молочкой чаще болела голова.',
  valence: 'negative',
  strength: 'moderate',
  evidence: { days: ['13-06-2026'], foods: ['молоко'] },
  source: 'daily',
  createdAt: '2026-06-13T00:00:00.000Z',
};

// Drive deletion through the row's keyboard long-press path (context-menu key /
// Shift+F10 → onLongPress, LongPressRow.tsx) instead of pointer timers — same
// onLongPress entry, no 450ms fake-timer dance. The <li> is the gesture target.
function longPressRow() {
  fireEvent.keyDown(screen.getByRole('listitem'), { key: 'ContextMenu' });
}

// Plan decision #2: deletion is destructive + irreversible, so the long press
// must gate onDelete behind ConfirmDrawer. Assembly/type checks can't see this —
// only that drawerStore.show is awaited and onDelete fires ONLY on `true`.
describe('InsightListPanel delete confirm gate', () => {
  afterEach(() => vi.restoreAllMocks());

  it('deletes only after the confirm drawer resolves true', async () => {
    const onDelete = vi.fn();
    const showSpy = vi.spyOn(drawerStore, 'show').mockResolvedValue(true);
    render(<InsightListPanel insights={[INSIGHT]} onDelete={onDelete} />);

    longPressRow();

    // Gated: onDelete must not fire synchronously — the drawer is consulted first.
    expect(showSpy).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('i1'));
  });

  it('does NOT delete when the confirm drawer is cancelled / dismissed', async () => {
    const onDelete = vi.fn();
    vi.spyOn(drawerStore, 'show').mockResolvedValue(false); // cancel; undefined (swipe) behaves the same
    render(<InsightListPanel insights={[INSIGHT]} onDelete={onDelete} />);

    longPressRow();
    // Flush the awaited drawer promise + its continuation.
    await Promise.resolve();
    await Promise.resolve();
    expect(onDelete).not.toHaveBeenCalled();
  });
});
