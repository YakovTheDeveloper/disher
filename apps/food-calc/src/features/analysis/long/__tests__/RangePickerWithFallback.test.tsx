import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { addDays, format, startOfDay } from 'date-fns';
import RangePickerWithFallback from '../RangePickerWithFallback';
import type { DateRange } from '../range';

const RANGE: DateRange = { start: '2026-05-01', end: '2026-05-15' };

describe('RangePickerWithFallback', () => {
  it('renders Начало/Конец masked fields with the value as DD-MM-YYYY', () => {
    render(<RangePickerWithFallback value={RANGE} onChange={() => {}} />);
    expect(screen.getByLabelText('Начало')).toHaveValue('01-05-2026');
    expect(screen.getByLabelText('Конец')).toHaveValue('15-05-2026');
  });

  it('typing a complete date emits the canonical yyyy-MM-dd, keeping the other end', () => {
    const onChange = vi.fn();
    render(<RangePickerWithFallback value={RANGE} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Начало'), {
      target: { value: '03052026' },
    });

    expect(onChange).toHaveBeenCalledWith({ start: '2026-05-03', end: '2026-05-15' });
  });

  it('emits an empty side while the typed date is still incomplete', () => {
    const onChange = vi.fn();
    render(<RangePickerWithFallback value={RANGE} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Начало'), {
      target: { value: '0305' },
    });

    expect(onChange).toHaveBeenCalledWith({ start: '', end: '2026-05-15' });
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

  it('warns when the end date is in the future', () => {
    const today = startOfDay(new Date());
    // Valid 8-day span, but the end sits one day ahead of today.
    const end = addDays(today, 1);
    const start = addDays(today, 1 - 7);
    render(
      <RangePickerWithFallback
        value={{ start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText(/конец не может быть в будущем/)).toBeTruthy();
  });
});
