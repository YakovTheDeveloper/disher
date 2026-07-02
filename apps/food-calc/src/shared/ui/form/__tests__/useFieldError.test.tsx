import { describe, it, expect } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { useFieldError } from '../useFieldError';
import NumberInput from '@/shared/ui/atoms/input/NumberInput/NumberInput';

describe('useFieldError', () => {
  it('starts clear — no aria-invalid, no describedby', () => {
    const { result } = renderHook(() => useFieldError());
    expect(result.current.error).toBeNull();
    expect(result.current.fieldProps['aria-invalid']).toBeUndefined();
    expect(result.current.fieldProps['aria-describedby']).toBeUndefined();
  });

  it('wires aria-invalid + aria-describedby to the stable errorId when set', () => {
    const { result } = renderHook(() => useFieldError());
    act(() => result.current.setError('слишком много'));
    expect(result.current.error).toBe('слишком много');
    expect(result.current.fieldProps['aria-invalid']).toBe(true);
    expect(result.current.fieldProps['aria-describedby']).toBe(result.current.errorId);
  });

  it('clear() removes the announcement wiring', () => {
    const { result } = renderHook(() => useFieldError());
    act(() => result.current.setError('bad'));
    act(() => result.current.clear());
    expect(result.current.error).toBeNull();
    expect(result.current.fieldProps['aria-invalid']).toBeUndefined();
  });
});

describe('NumberInput error prop (a11y)', () => {
  it('renders a bare input with no aria-invalid when valid', () => {
    render(<NumberInput value={5} onChange={() => {}} />);
    const input = screen.getByDisplayValue('5');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('announces an error and links it via aria-describedby when set', () => {
    render(<NumberInput value={5} onChange={() => {}} error="Допустимо 0–100" />);
    const input = screen.getByDisplayValue('5');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Допустимо 0–100');
    // The input points at exactly the rendered FieldError node.
    expect(input.getAttribute('aria-describedby')).toBe(alert.getAttribute('id'));
  });
});
