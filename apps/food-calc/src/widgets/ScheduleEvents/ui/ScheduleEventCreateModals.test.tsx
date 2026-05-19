/* eslint-disable @typescript-eslint/no-explicit-any -- lightweight test-mock props */
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import ScheduleEventCreateModals from './ScheduleEventCreateModals';
import { MODAL_INPUT_IDS } from './ScheduleEventCreateModals.constants';

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

vi.mock('@/shared/ui/Swipeable/SwipeableLockContext', () => ({
  useSwipeableLock: vi.fn(),
}));
vi.mock('@/shared/lib/useOverlayHistory', () => ({
  useOverlayHistory: vi.fn(),
}));
vi.mock('@/entities/schedule-event', () => ({
  addScheduleEvent: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/entities/schedule-event/model/draft', () => ({
  useEventDraftStore: (selector: any) =>
    selector({ draft: { atoms: [] }, clearAtoms: vi.fn() }),
}));
vi.mock('@/shared/ui/TimeChoose', () => ({
  TimeChoose: (props: any) => (
    <div data-testid="time-choose">
      <input id={props.inputId} data-testid="time-input" />
    </div>
  ),
}));
vi.mock('@/widgets/ScheduleEvents/components/AtomBuilder', () => ({
  AtomBuilder: (props: any) => (
    <div data-testid="atom-builder">
      <input id={props.id} data-testid="atoms-input" />
    </div>
  ),
}));
vi.mock('@/shared/ui/atoms/input/AutoGrowSearch', () => ({
  AutoGrowSearch: (props: any) => (
    <textarea
      id={props.id}
      data-testid="text-input"
      value={props.value}
      onChange={(e) => props.onChange?.(e.target.value)}
    />
  ),
}));

// ── helpers ──────────────────────────────────────────────────────────────────

const expanded = (): HTMLElement => {
  const node = document.querySelector('[data-modal-by-label="expanded"]');
  if (!node) throw new Error('No expanded ModalByLabel in document');
  return node as HTMLElement;
};

const focusInput = (id: string) => {
  const el = document.getElementById(id);
  expect(el).not.toBeNull();
  fireEvent.focus(el!);
};

const clickActiveBack = () => {
  const btn = expanded().querySelector('header button');
  if (!btn) throw new Error('No header back button in active modal');
  fireEvent.click(btn);
};

const clickActiveByText = (text: string) => {
  const btn = Array.from(expanded().querySelectorAll('button')).find(
    (b) => b.textContent?.trim() === text,
  );
  if (!btn) throw new Error(`No button "${text}" in active modal`);
  fireEvent.click(btn);
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── back-correctness ─────────────────────────────────────────────────────────

describe('ScheduleEventCreateModals — header back is step-aware', () => {
  it('back from the text step returns to the time step', () => {
    render(<ScheduleEventCreateModals scheduleId="2026-05-19" />);

    focusInput(MODAL_INPUT_IDS.TIME_INPUT);
    focusInput(MODAL_INPUT_IDS.TEXT_INPUT);
    // sanity: we're on the text step
    expect(expanded().querySelector('[data-testid="text-input"]')).not.toBeNull();

    clickActiveBack();

    // back → time step
    expect(expanded().querySelector('[data-testid="time-choose"]')).not.toBeNull();
  });

  it('back from the atoms step returns to the text step', () => {
    render(<ScheduleEventCreateModals scheduleId="2026-05-19" />);

    focusInput(MODAL_INPUT_IDS.TIME_INPUT);
    focusInput(MODAL_INPUT_IDS.TEXT_INPUT);
    // text → atoms is driven by the "Далее" button, not focus delegation.
    clickActiveByText('Далее');
    expect(expanded().querySelector('[data-testid="atom-builder"]')).not.toBeNull();

    clickActiveBack();

    expect(expanded().querySelector('[data-testid="text-input"]')).not.toBeNull();
  });

  it('back from the first step (time) closes the whole flow', () => {
    render(<ScheduleEventCreateModals scheduleId="2026-05-19" />);

    focusInput(MODAL_INPUT_IDS.TIME_INPUT);
    expect(expanded().querySelector('[data-testid="time-choose"]')).not.toBeNull();

    clickActiveBack();

    // flow closed — nothing expanded
    expect(document.querySelector('[data-modal-by-label="expanded"]')).toBeNull();
  });
});
