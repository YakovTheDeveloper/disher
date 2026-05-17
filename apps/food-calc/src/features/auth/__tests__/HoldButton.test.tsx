// HoldButton — press-and-hold confirmation. Driven here via the keyboard path
// (Enter/Space) so the test exercises the rAF + countdown logic without
// depending on jsdom PointerEvent support. Fake timers fake both
// requestAnimationFrame and performance.now so the 5s hold is instant.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('../HoldButton.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `hold-${String(p)}` }),
}));

const { HoldButton } = await import('../HoldButton');

const baseProps = {
  holdMs: 5000,
  label: 'Удерживайте, чтобы выйти',
  activeLabel: 'Не отпускайте…',
  busyLabel: 'Выходим…',
};

beforeEach(() => {
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
      'Date',
    ],
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('HoldButton', () => {
  it('fires onComplete after the key is held for holdMs', () => {
    const onComplete = vi.fn();
    render(<HoldButton {...baseProps} onComplete={onComplete} />);
    const btn = screen.getByRole('button');

    fireEvent.keyDown(btn, { key: 'Enter' });
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(baseProps.holdMs + 1000);
    });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('resets without firing when the key is released early', () => {
    const onComplete = vi.fn();
    render(<HoldButton {...baseProps} onComplete={onComplete} />);
    const btn = screen.getByRole('button');

    fireEvent.keyDown(btn, { key: 'Enter' });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.keyUp(btn, { key: 'Enter' });
    act(() => {
      vi.advanceTimersByTime(baseProps.holdMs + 1000);
    });

    expect(onComplete).not.toHaveBeenCalled();
    // The idle label is restored after the cancelled hold.
    expect(btn).toHaveTextContent(baseProps.label);
  });

  it('does not start while busy', () => {
    const onComplete = vi.fn();
    render(<HoldButton {...baseProps} busy onComplete={onComplete} />);
    const btn = screen.getByRole('button');

    fireEvent.keyDown(btn, { key: 'Enter' });
    act(() => {
      vi.advanceTimersByTime(baseProps.holdMs + 1000);
    });

    expect(onComplete).not.toHaveBeenCalled();
    expect(btn).toHaveTextContent(baseProps.busyLabel);
  });

  it('does not start while disabled', () => {
    const onComplete = vi.fn();
    render(<HoldButton {...baseProps} disabled onComplete={onComplete} />);
    const btn = screen.getByRole('button');

    fireEvent.keyDown(btn, { key: 'Enter' });
    act(() => {
      vi.advanceTimersByTime(baseProps.holdMs + 1000);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('completes on a Space hold too', () => {
    const onComplete = vi.fn();
    render(<HoldButton {...baseProps} onComplete={onComplete} />);
    const btn = screen.getByRole('button');

    fireEvent.keyDown(btn, { key: ' ' });
    act(() => {
      vi.advanceTimersByTime(baseProps.holdMs + 1000);
    });
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
