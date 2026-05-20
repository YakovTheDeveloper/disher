// ScaleAtomInput — phenomenon text field + preset chips. The field is the
// single source of the label: a chip tap writes straight into it.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ScaleAtomInput } from './ScaleAtomInput';

describe('ScaleAtomInput preset chips', () => {
  it('fills the phenomenon field with the preset text when a chip is tapped', () => {
    render(<ScaleAtomInput onAddAtom={vi.fn()} onClose={vi.fn()} />);

    const field = screen.getByPlaceholderText('Явление') as HTMLTextAreaElement;
    expect(field.value).toBe('');

    fireEvent.click(screen.getByRole('button', { name: 'Боль' }));

    expect(field.value).toBe('Боль');
  });

  it('a chip tap replaces whatever was typed in the field', () => {
    render(<ScaleAtomInput onAddAtom={vi.fn()} onClose={vi.fn()} />);

    const field = screen.getByPlaceholderText('Явление') as HTMLTextAreaElement;
    fireEvent.change(field, { target: { value: 'своё' } });
    expect(field.value).toBe('своё');

    fireEvent.click(screen.getByRole('button', { name: 'Энергия' }));
    expect(field.value).toBe('Энергия');
  });
});

describe('ScaleAtomInput commit', () => {
  it('commits a scale atom with the field text as label', () => {
    const onAddAtom = vi.fn();
    render(<ScaleAtomInput onAddAtom={onAddAtom} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Стресс' }));
    // The action button appears once the value input is focused.
    fireEvent.focus(screen.getByDisplayValue('5'));
    fireEvent.click(screen.getByText('Добавить'));

    expect(onAddAtom).toHaveBeenCalledWith({ kind: 'scale', value: 5, label: 'Стресс' });
  });

  it('commits with an undefined label when no phenomenon is entered', () => {
    const onAddAtom = vi.fn();
    render(<ScaleAtomInput onAddAtom={onAddAtom} onClose={vi.fn()} />);

    fireEvent.focus(screen.getByDisplayValue('5'));
    fireEvent.click(screen.getByText('Добавить'));

    expect(onAddAtom).toHaveBeenCalledWith({ kind: 'scale', value: 5, label: undefined });
  });
});
