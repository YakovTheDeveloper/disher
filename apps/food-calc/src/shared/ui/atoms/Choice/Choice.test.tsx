import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChoiceGroup, ChoiceItem } from './Choice';

function setup(value: string | null, onChange = vi.fn()) {
  render(
    <ChoiceGroup value={value} onChange={onChange} aria-label="Размер">
      <ChoiceItem value="s">S</ChoiceItem>
      <ChoiceItem value="m">M</ChoiceItem>
      <ChoiceItem value="l">L</ChoiceItem>
    </ChoiceGroup>,
  );
  return { onChange };
}

describe('Choice', () => {
  it('renders a radiogroup of radios', () => {
    setup('m');
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('marks the selected item aria-checked', () => {
    setup('m');
    expect(screen.getByRole('radio', { name: 'M' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'S' })).toHaveAttribute('aria-checked', 'false');
  });

  it('selects on click', () => {
    const { onChange } = setup('m');
    fireEvent.click(screen.getByRole('radio', { name: 'L' }));
    expect(onChange).toHaveBeenCalledWith('l');
  });

  it('roving tabindex: only the selected item is tabbable', () => {
    setup('m');
    expect(screen.getByRole('radio', { name: 'M' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('radio', { name: 'S' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('radio', { name: 'L' })).toHaveAttribute('tabindex', '-1');
  });

  it('makes the first item tabbable when nothing is selected', () => {
    setup(null);
    expect(screen.getByRole('radio', { name: 'S' })).toHaveAttribute('tabindex', '0');
  });

  it('ArrowRight moves focus to and selects the next item', () => {
    const { onChange } = setup('s');
    screen.getByRole('radio', { name: 'S' }).focus();
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('m');
    expect(screen.getByRole('radio', { name: 'M' })).toHaveFocus();
  });

  it('ArrowLeft from the first item wraps to the last', () => {
    const { onChange } = setup('s');
    screen.getByRole('radio', { name: 'S' }).focus();
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith('l');
  });

  it('End jumps to the last item, Home to the first', () => {
    const { onChange } = setup('s');
    screen.getByRole('radio', { name: 'S' }).focus();
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'End' });
    expect(onChange).toHaveBeenLastCalledWith('l');
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'Home' });
    expect(onChange).toHaveBeenLastCalledWith('s');
  });
});
