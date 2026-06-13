import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import InlineTimeEditor from './InlineTimeEditor';

// Controlled React inputs + maxLength make userEvent.type unreliable in jsdom
// (selection-replace via onFocus doesn't fire). fireEvent.change drives onChange
// directly — the same approach as TimePicker.test.tsx.
const changeInput = (input: HTMLElement, value: string) =>
  fireEvent.change(input, { target: { value } });

function renderEditor(value = '17:22', onCommit = vi.fn()) {
  render(<InlineTimeEditor value={value} onCommit={onCommit} />);
  // Click the display text to enter edit mode (mounts the hh/mm inputs).
  fireEvent.click(screen.getByText(value));
  return {
    hoursInput: screen.getByLabelText('Hour'),
    minutesInput: screen.getByLabelText('Minute'),
    onCommit,
  };
}

// ─── regression: premature commit on hours entry ─────────────────────────────
// Bug (2026-06-13): editing 17:22, typing the hour "16" jumped focus to minutes
// (correct) BUT also blurred the hour field, which committed "16:22" before the
// user typed the minutes — the time changed underneath them. The fix stops the
// inline editor committing on hours-blur; it commits only after minutes complete
// or when focus truly leaves the editor.

describe('InlineTimeEditor — commit timing', () => {
  it('does NOT commit when only the hour is entered — waits for minutes', async () => {
    const { hoursInput, minutesInput, onCommit } = renderEditor('17:22');

    changeInput(hoursInput, '16');

    // Focus still auto-advances to minutes…
    await waitFor(() => expect(minutesInput).toHaveFocus());
    // …but the time has NOT been committed yet (this is the regression).
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('commits the full HH:MM once minutes are entered', async () => {
    const { hoursInput, minutesInput, onCommit } = renderEditor('17:22');

    changeInput(hoursInput, '16');
    await waitFor(() => expect(minutesInput).toHaveFocus());

    changeInput(minutesInput, '34');

    await waitFor(() => expect(onCommit).toHaveBeenCalledWith('16:34'));
    // Never committed the intermediate "16:22" — every call is the final value.
    for (const [arg] of onCommit.mock.calls) expect(arg).toBe('16:34');
  });

  it('does not commit at all when the value is unchanged', async () => {
    const { hoursInput, minutesInput, onCommit } = renderEditor('17:22');

    // Re-type the same hour, then the same minutes (the mm input is in the DOM
    // regardless of focus, so drive it directly — no need to await the auto-jump).
    changeInput(hoursInput, '17');
    changeInput(minutesInput, '22');

    // Give any queued setTimeout(0) commits a chance to fire.
    await act(() => new Promise((r) => setTimeout(r, 0)));
    expect(onCommit).not.toHaveBeenCalled();
  });
});

// ─── commit on leaving the editor (data not lost) ────────────────────────────

describe('InlineTimeEditor — commit on blur', () => {
  it('commits the edited hour when focus leaves the editor without typing minutes', async () => {
    const { hoursInput, onCommit } = renderEditor('17:22');

    // Single hour digit (0/1/2 → no auto-advance), then blur out of the editor.
    // Native .blur() actually moves document.activeElement to <body> (fireEvent
    // .blur does NOT in jsdom), so the editor's wrapper-blur sees focus has truly
    // left and commits the typed value.
    hoursInput.focus();
    changeInput(hoursInput, '1');
    act(() => hoursInput.blur());

    await waitFor(() => expect(onCommit).toHaveBeenCalledWith('01:22'));
  });

  it('keeps the editor open while focus moves between hour and minute fields', async () => {
    const { hoursInput, minutesInput, onCommit } = renderEditor('17:22');

    changeInput(hoursInput, '16');
    // Auto-advance moves focus hh → mm (blur of hh). The editor must stay open
    // and NOT commit on that internal hop.
    await waitFor(() => expect(minutesInput).toHaveFocus());

    expect(screen.getByLabelText('Minute')).toBeInTheDocument();
    expect(onCommit).not.toHaveBeenCalled();
  });
});

// ─── escape cancels ──────────────────────────────────────────────────────────

describe('InlineTimeEditor — escape', () => {
  it('reverts and exits edit mode on Escape without committing', async () => {
    const { hoursInput, onCommit } = renderEditor('17:22');

    changeInput(hoursInput, '16');
    fireEvent.keyDown(hoursInput, { key: 'Escape' });

    await waitFor(() => expect(screen.getByText('17:22')).toBeInTheDocument());
    expect(onCommit).not.toHaveBeenCalled();
  });
});
