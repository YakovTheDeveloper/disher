import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { EditableQuantity } from './EditableQuantity';

function renderQty({ value = 100 }: { value?: number } = {}) {
  const onCommit = vi.fn();
  const utils = render(<EditableQuantity value={value} unit="г" onCommit={onCommit} />);
  const input = screen.getByRole('textbox') as HTMLInputElement;
  return { onCommit, input, ...utils };
}

describe('EditableQuantity', () => {
  it('renders the authoritative value as an editable input', () => {
    const { input } = renderQty({ value: 100 });
    expect(input).toHaveValue('100');
  });

  it('commits the new value on blur when it really changed', async () => {
    const user = userEvent.setup();
    const { onCommit, input } = renderQty({ value: 100 });

    await user.clear(input);
    await user.type(input, '250');
    await user.tab(); // blur

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(250);
  });

  it('does NOT commit on blur when the value is unchanged', async () => {
    const user = userEvent.setup();
    const { onCommit, input } = renderQty({ value: 100 });

    await user.click(input);
    await user.tab(); // blur without editing

    expect(onCommit).not.toHaveBeenCalled();
  });

  it('does NOT commit a zero/empty value', async () => {
    const user = userEvent.setup();
    const { onCommit, input } = renderQty({ value: 100 });

    await user.clear(input); // → 0
    await user.tab();

    expect(onCommit).not.toHaveBeenCalled();
  });

  it('Enter commits the edited value (blurs the field)', async () => {
    const user = userEvent.setup();
    const { onCommit, input } = renderQty({ value: 100 });

    await user.clear(input);
    await user.type(input, '75{Enter}');

    expect(onCommit).toHaveBeenCalledWith(75);
  });

  it('re-syncs the draft when the external value changes', () => {
    const { input, rerender } = renderQty({ value: 100 });
    expect(input).toHaveValue('100');

    rerender(<EditableQuantity value={180} unit="г" onCommit={vi.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('180');
  });
});
