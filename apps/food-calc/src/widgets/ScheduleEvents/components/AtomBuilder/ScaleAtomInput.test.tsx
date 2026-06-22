// ScaleAtomInput — the scale form is now store-backed (no «Добавить» button):
// edits write into `pendingScale`, the modal's «Готово» commits it. These tests
// cover that a chip/typing/number reach the store.
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ScaleAtomInput } from './ScaleAtomInput';
import { useEventDraftStore } from '@/entities/schedule-event/model/draft';

beforeEach(() => {
  useEventDraftStore.getState().clear(); // resets draft + pendingScale
});

describe('ScaleAtomInput — store-backed pending scale', () => {
  it('a preset choice writes the label into pendingScale + the field', () => {
    render(<ScaleAtomInput />);
    const field = screen.getByPlaceholderText('Явление') as HTMLTextAreaElement;
    expect(field.value).toBe('');

    fireEvent.click(screen.getByRole('radio', { name: 'Боль' }));

    expect(field.value).toBe('Боль');
    expect(useEventDraftStore.getState().pendingScale.label).toBe('Боль');
    expect(useEventDraftStore.getState().pendingScale.touched).toBe(true);
  });

  it('typing the phenomenon updates pendingScale', () => {
    render(<ScaleAtomInput />);
    const field = screen.getByPlaceholderText('Явление') as HTMLTextAreaElement;

    fireEvent.change(field, { target: { value: 'мигрень' } });

    expect(useEventDraftStore.getState().pendingScale.label).toBe('мигрень');
  });

  it('changing the number clamps to 1–10 in pendingScale', () => {
    render(<ScaleAtomInput />);
    const number = screen.getByDisplayValue('5') as HTMLInputElement;

    fireEvent.change(number, { target: { value: '99' } });

    expect(useEventDraftStore.getState().pendingScale.value).toBe(10);
  });
});
