import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LongPressRow from './LongPressRow';

const LONG_PRESS_DELAY = 450; // keep in sync with LongPressRow

beforeEach(() => {
  // jsdom's setPointerCapture throws without an actively-tracked pointer, which
  // would abort onPointerDown before the long-press timer is set. Stub to no-op.
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const setup = (withLongPress = true) => {
  const onClick = vi.fn();
  const onLongPress = vi.fn();
  const { container } = render(
    <LongPressRow
      id="row-1"
      onClick={onClick}
      onLongPress={withLongPress ? onLongPress : undefined}
    >
      <span>content</span>
    </LongPressRow>,
  );
  const row = container.querySelector('li') as HTMLLIElement;
  return { row, onClick, onLongPress };
};

// jsdom's PointerEvent does not carry `button`/`clientX`/`clientY` from the init
// dict, so we build a plain Event and assign them — React reads these off the
// native event, so the component sees real coordinates.
const firePointer = (
  el: Element,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  x: number,
  y: number,
  button = 0,
) => {
  const ev = new Event(type, { bubbles: true, cancelable: true }) as Event & Record<string, number>;
  ev.button = button;
  ev.clientX = x;
  ev.clientY = y;
  ev.pointerId = 1;
  fireEvent(el, ev);
};

describe('LongPressRow', () => {
  it('a sustained press fires onLongPress and NOT onClick', () => {
    const { row, onClick, onLongPress } = setup();

    firePointer(row, 'pointerdown', 50, 50);
    act(() => vi.advanceTimersByTime(LONG_PRESS_DELAY));
    firePointer(row, 'pointerup', 50, 50);

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('a short tap fires onClick and NOT onLongPress', () => {
    const { row, onClick, onLongPress } = setup();

    firePointer(row, 'pointerdown', 50, 50);
    act(() => vi.advanceTimersByTime(100)); // released before the long-press threshold
    firePointer(row, 'pointerup', 50, 50);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('moving past the threshold cancels the pending long press', () => {
    const { row, onLongPress } = setup();

    firePointer(row, 'pointerdown', 50, 50);
    firePointer(row, 'pointermove', 80, 50); // 30px > MOVE_THRESHOLD (10)
    act(() => vi.advanceTimersByTime(LONG_PRESS_DELAY));

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('without onLongPress a press is a plain tap (no throw, fires onClick)', () => {
    const { row, onClick } = setup(false);

    firePointer(row, 'pointerdown', 50, 50);
    act(() => vi.advanceTimersByTime(LONG_PRESS_DELAY));
    firePointer(row, 'pointerup', 50, 50);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('ignores non-primary buttons (right-click never starts a press)', () => {
    const onClick = vi.fn();
    const onLongPress = vi.fn();
    const { container } = render(
      <LongPressRow id="r" onClick={onClick} onLongPress={onLongPress}>
        <span>c</span>
      </LongPressRow>,
    );
    const row = container.querySelector('li') as HTMLLIElement;

    firePointer(row, 'pointerdown', 50, 50, 2); // right button
    act(() => vi.advanceTimersByTime(LONG_PRESS_DELAY));
    firePointer(row, 'pointerup', 50, 50, 2);

    expect(onLongPress).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('after a long press, the following click is suppressed (prevents native label activation + inner onClick)', () => {
    const onLongPress = vi.fn();
    const innerClick = vi.fn();
    const { container } = render(
      <LongPressRow id="r" onLongPress={onLongPress}>
        <button type="button" onClick={innerClick}>
          edit
        </button>
      </LongPressRow>,
    );
    const row = container.querySelector('li') as HTMLLIElement;
    const inner = container.querySelector('button') as HTMLButtonElement;

    firePointer(row, 'pointerdown', 50, 50);
    act(() => vi.advanceTimersByTime(LONG_PRESS_DELAY)); // long press → preventNextClick armed
    firePointer(row, 'pointerup', 50, 50); // 50ms reset not advanced → still armed

    const clickEv = new Event('click', { bubbles: true, cancelable: true });
    fireEvent(inner, clickEv);

    expect(innerClick).not.toHaveBeenCalled(); // stopPropagation
    expect(clickEv.defaultPrevented).toBe(true); // preventDefault → no <label htmlFor> focus
  });
});
