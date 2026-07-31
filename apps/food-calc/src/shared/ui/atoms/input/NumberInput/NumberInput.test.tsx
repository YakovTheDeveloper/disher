import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NumberInput from './NumberInput';

// NumberInput — контролируемый: draft ре-синкается из пропа `value`, поэтому
// тесту нужен родитель, который возвращает onChange обратно в value (как в бою).
const Harness = ({ allowDecimals, onChange }: { allowDecimals?: boolean; onChange: (n: number) => void }) => {
  const [value, setValue] = useState(0);
  return (
    <NumberInput
      value={value}
      allowDecimals={allowDecimals}
      onChange={(n) => {
        setValue(n);
        onChange(n);
      }}
    />
  );
};

const getInput = () => screen.getByRole('textbox') as HTMLInputElement;

describe('NumberInput allowDecimals', () => {
  it('stays integer-only by default: dot is stripped ("1.5" → 15)', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.change(getInput(), { target: { value: '1.5' } });
    expect(onChange).toHaveBeenLastCalledWith(15);
    expect(getInput().value).toBe('15');
  });

  it('accepts a fractional value ("1.5" → 1.5)', () => {
    const onChange = vi.fn();
    render(<Harness allowDecimals onChange={onChange} />);
    fireEvent.change(getInput(), { target: { value: '1.5' } });
    expect(onChange).toHaveBeenLastCalledWith(1.5);
    expect(getInput().value).toBe('1.5');
  });

  it('normalizes comma to dot ("1,5" → 1.5)', () => {
    const onChange = vi.fn();
    render(<Harness allowDecimals onChange={onChange} />);
    fireEvent.change(getInput(), { target: { value: '1,5' } });
    expect(onChange).toHaveBeenLastCalledWith(1.5);
    expect(getInput().value).toBe('1.5');
  });

  it('ignores a second dot ("1.5.2" → 1.52)', () => {
    const onChange = vi.fn();
    render(<Harness allowDecimals onChange={onChange} />);
    fireEvent.change(getInput(), { target: { value: '1.5.2' } });
    expect(onChange).toHaveBeenLastCalledWith(1.52);
    expect(getInput().value).toBe('1.52');
  });

  it('keeps a trailing dot in the draft while emitting the integer part ("1." → 1)', () => {
    const onChange = vi.fn();
    render(<Harness allowDecimals onChange={onChange} />);
    fireEvent.change(getInput(), { target: { value: '1.' } });
    expect(onChange).toHaveBeenLastCalledWith(1);
    expect(getInput().value).toBe('1.');
  });
});
