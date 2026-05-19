// RelationAtomInput — preset-чипы. Тест проверяет суть фичи: тап по чипу
// заполняет инпут текстом пресета, и тап не роняет фокус инпута.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { RelationAtomInput } from './RelationAtomInput';

describe('RelationAtomInput preset chips', () => {
  it('fills the input with the preset text when a chip is tapped', () => {
    render(<RelationAtomInput onAddAtom={vi.fn()} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText('причина или связь') as HTMLTextAreaElement;
    expect(input.value).toBe('');

    fireEvent.click(screen.getByRole('button', { name: 'из-за стресса' }));
    expect(input.value).toBe('из-за стресса');
  });

  it('does not blur the focused input on chip tap (mousedown is preventDefault-ed)', () => {
    render(<RelationAtomInput onAddAtom={vi.fn()} onClose={vi.fn()} />);

    const chip = screen.getByRole('button', { name: 'после еды' });
    // The chip wires onMouseDown→preventDefault; a cancelled event returns false.
    const notCancelled = fireEvent.mouseDown(chip);
    expect(notCancelled).toBe(false);
  });
});
