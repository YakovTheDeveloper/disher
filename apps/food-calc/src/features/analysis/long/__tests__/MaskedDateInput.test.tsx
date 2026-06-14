import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MaskedDateInput from '../MaskedDateInput';

// MaskedDateInput is controlled — a tiny stateful harness mirrors the real host
// (value flows down, onChange flows up) so we can observe both the emitted
// canonical key and the on-screen masked text.
function Harness({
  initial = '',
  onValue,
}: {
  initial?: string;
  onValue?: (v: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <MaskedDateInput
      aria-label="date"
      value={value}
      onChange={(v) => {
        setValue(v);
        onValue?.(v);
      }}
    />
  );
}

const input = () => screen.getByLabelText('date');

describe('MaskedDateInput', () => {
  it('shows the canonical value as DD-MM-YYYY', () => {
    render(<MaskedDateInput aria-label="date" value="2026-06-13" onChange={() => {}} />);
    expect(input()).toHaveValue('13-06-2026');
  });

  it('auto-inserts dashes and emits yyyy-MM-dd once a full valid date is typed', () => {
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);

    fireEvent.change(input(), { target: { value: '13062026' } });

    expect(input()).toHaveValue('13-06-2026');
    expect(onValue).toHaveBeenLastCalledWith('2026-06-13');
  });

  it('emits an empty string while the entry is incomplete', () => {
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);

    fireEvent.change(input(), { target: { value: '1306' } });

    expect(input()).toHaveValue('13-06');
    expect(onValue).toHaveBeenLastCalledWith('');
  });

  it('rejects an impossible date (31 April) as empty, not a rolled-over value', () => {
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);

    fireEvent.change(input(), { target: { value: '31042026' } });

    // Masked text stays as typed, but no canonical key is emitted.
    expect(input()).toHaveValue('31-04-2026');
    expect(onValue).toHaveBeenLastCalledWith('');
  });

  it('strips digits beyond the 8 needed', () => {
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);

    fireEvent.change(input(), { target: { value: '130620261234' } });

    expect(input()).toHaveValue('13-06-2026');
    expect(onValue).toHaveBeenLastCalledWith('2026-06-13');
  });

  it('reflects an external value change without re-typing', () => {
    const { rerender } = render(
      <MaskedDateInput aria-label="date" value="2026-06-13" onChange={() => {}} />,
    );
    expect(input()).toHaveValue('13-06-2026');

    rerender(<MaskedDateInput aria-label="date" value="2026-01-01" onChange={() => {}} />);
    expect(input()).toHaveValue('01-01-2026');
  });
});
