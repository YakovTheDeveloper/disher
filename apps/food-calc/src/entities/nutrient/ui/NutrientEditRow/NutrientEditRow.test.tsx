// @vitest-environment jsdom
// Guards the blur-draft contract carried over from the dissolved NutrientTable:
// the row commits its edit on BLUR, not on each keystroke (so Dexie isn't written
// per character and a mid-typing zero isn't treated as delete).
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { NutrientEditRow } from './NutrientEditRow';

describe('NutrientEditRow — blur-draft', () => {
  it('commits on blur, not on each keystroke', () => {
    const onValueChange = vi.fn();
    const { getByRole } = render(
      <NutrientEditRow name="Белки" unit="г" value={10} onValueChange={onValueChange} />,
    );
    const input = getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '25' } });
    // Typing only updates the local draft — no commit yet.
    expect(onValueChange).not.toHaveBeenCalled();

    fireEvent.blur(input);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(25);
  });

  it('rounds an integer-unit base value for its initial display', () => {
    const { getByRole } = render(
      <NutrientEditRow name="Энергия" unit="ккал" value={519.6} onValueChange={vi.fn()} />,
    );
    expect((getByRole('textbox') as HTMLInputElement).value).toBe('520');
  });
});
