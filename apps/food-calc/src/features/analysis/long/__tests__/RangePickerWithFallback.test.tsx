import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RangePickerWithFallback from '../RangePickerWithFallback';
import { windowSpanDays, type DateRange } from '../range';

const RANGE: DateRange = { start: '2026-05-01', end: '2026-05-15' };

describe('RangePickerWithFallback', () => {
  it('renders all five span presets', () => {
    render(<RangePickerWithFallback value={RANGE} onChange={() => {}} />);
    for (const p of [7, 14, 21, 28, 35]) {
      expect(screen.getByText(`${p} дней`)).toBeTruthy();
    }
  });

  it('tapping a preset keeps the end date and recomputes the span', () => {
    const onChange = vi.fn();
    render(<RangePickerWithFallback value={RANGE} onChange={onChange} />);

    fireEvent.click(screen.getByText('21 дней'));

    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as DateRange;
    expect(next.end).toBe('2026-05-15'); // end kept
    expect(windowSpanDays(next)).toBe(21); // span = preset
  });

  it('switches to the native fallback inputs on toggle', () => {
    render(<RangePickerWithFallback value={RANGE} onChange={() => {}} />);
    expect(screen.queryByText('Начало')).toBeNull();

    fireEvent.click(screen.getByText('Вручную'));

    expect(screen.getByText('Начало')).toBeTruthy();
    expect(screen.getByText('Конец')).toBeTruthy();
  });

  it('shows the 7..35 hint when the window is out of range', () => {
    render(
      <RangePickerWithFallback
        value={{ start: '2026-05-12', end: '2026-05-15' }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText(/окно должно быть от 7 до 35 дней/)).toBeTruthy();
  });
});
