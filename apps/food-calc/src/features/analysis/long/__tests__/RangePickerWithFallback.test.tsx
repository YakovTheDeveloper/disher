import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { addDays, format, startOfDay, subDays } from 'date-fns';
import RangePickerWithFallback from '../RangePickerWithFallback';
import type { DateRange } from '../range';

const ISO = 'yyyy-MM-dd';
const clickDay = (dateStr: string) =>
  fireEvent.click(document.querySelector(`[data-date="${dateStr}"]`) as Element);

describe('RangePickerWithFallback', () => {
  it('renders Начало/Конец field triggers for the current range', () => {
    const today = startOfDay(new Date());
    const range: DateRange = { start: format(subDays(today, 10), ISO), end: format(today, ISO) };
    render(<RangePickerWithFallback value={range} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Начало' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Конец' })).toBeInTheDocument();
  });

  it('the calendar is collapsed until a field is tapped', () => {
    const today = startOfDay(new Date());
    const range: DateRange = { start: format(subDays(today, 10), ISO), end: format(today, ISO) };
    render(<RangePickerWithFallback value={range} onChange={() => {}} />);

    // No day cells before opening.
    expect(document.querySelector('[data-date]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Начало' }));
    expect(document.querySelector('[data-date]')).not.toBeNull();
  });

  it('tapping «Начало» then a day emits that day as the new start, keeping the end', () => {
    const today = startOfDay(new Date());
    const newStart = subDays(today, 12);
    const range: DateRange = { start: format(subDays(today, 10), ISO), end: format(today, ISO) };
    const onChange = vi.fn();
    render(<RangePickerWithFallback value={range} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Начало' }));
    clickDay(format(newStart, ISO));

    expect(onChange).toHaveBeenCalledWith({
      start: format(newStart, ISO),
      end: format(today, ISO),
    });
  });

  it('picking a start later than the end drags the end along (start ≤ end)', () => {
    const today = startOfDay(new Date());
    const laterThanEnd = subDays(today, 5);
    const range: DateRange = {
      start: format(subDays(today, 20), ISO),
      end: format(subDays(today, 10), ISO),
    };
    const onChange = vi.fn();
    render(<RangePickerWithFallback value={range} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Начало' }));
    clickDay(format(laterThanEnd, ISO));

    expect(onChange).toHaveBeenCalledWith({
      start: format(laterThanEnd, ISO),
      end: format(laterThanEnd, ISO),
    });
  });

  it('shows the 7..35 hint when the window is out of range', () => {
    const today = startOfDay(new Date());
    render(
      <RangePickerWithFallback
        value={{ start: format(subDays(today, 3), ISO), end: format(today, ISO) }}
        onChange={() => {}}
      />
    );
    expect(screen.getByText(/окно должно быть от 7 до 35 дней/)).toBeInTheDocument();
  });

  it('warns when the end date is in the future', () => {
    const today = startOfDay(new Date());
    const end = addDays(today, 1);
    const start = addDays(today, 1 - 7);
    render(
      <RangePickerWithFallback
        value={{ start: format(start, ISO), end: format(end, ISO) }}
        onChange={() => {}}
      />
    );
    expect(screen.getByText(/конец не может быть в будущем/)).toBeInTheDocument();
  });
});
