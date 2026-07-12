import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import ProductQuantity from './ProductQuantity';
import type { Portion } from './ProductQuantity';

const portions: Portion[] = [
  { label: 'среднее', grams: 50 },
  { label: 'крупное', grams: 63 },
];

function renderQuantity({
  quantity = 100,
  product,
  dish,
}: {
  quantity?: number;
  product?: { portions?: Portion[] };
  dish?: { portions?: Portion[] };
} = {}) {
  const updateQuantity = vi.fn();
  const onFinish = vi.fn();

  render(
    <ProductQuantity content={{ quantity, updateQuantity, product, dish }} onFinish={onFinish} />
  );

  return { updateQuantity, onFinish };
}

describe('ProductQuantity — portions carousel', () => {
  it('always renders the quantity input', () => {
    renderQuantity();
    expect(screen.getByPlaceholderText('Количество')).toBeInTheDocument();
  });

  it('renders no portion chips when no portions provided', () => {
    renderQuantity();
    expect(screen.queryByText(/среднее/)).not.toBeInTheDocument();
  });

  it('renders a chip per portion when product has portions', () => {
    renderQuantity({ product: { portions } });
    // Chip content is split across spans (label · grams) — query the radio by its
    // accessible name (concatenated text content) rather than a single text node.
    expect(screen.getByRole('radio', { name: /среднее/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /крупное/ })).toBeInTheDocument();
  });

  it('renders portion chips when dish has portions', () => {
    renderQuantity({ dish: { portions } });
    expect(screen.getByRole('radio', { name: /среднее/ })).toBeInTheDocument();
  });
});

describe('ProductQuantity — portion selection', () => {
  it('tapping a portion sets the quantity to its grams', async () => {
    const user = userEvent.setup();
    const { updateQuantity } = renderQuantity({ quantity: 0, product: { portions } });

    await user.click(screen.getByRole('radio', { name: /среднее/ }));

    expect(updateQuantity).toHaveBeenLastCalledWith(50);
  });

  it('tapping a different portion switches to its grams', async () => {
    const user = userEvent.setup();
    const { updateQuantity } = renderQuantity({ quantity: 0, product: { portions } });

    await user.click(screen.getByRole('radio', { name: /среднее/ }));
    await user.click(screen.getByRole('radio', { name: /крупное/ }));

    expect(updateQuantity).toHaveBeenLastCalledWith(63);
  });

  it('shows the stepper only after a portion is active', async () => {
    const user = userEvent.setup();
    renderQuantity({ quantity: 0, product: { portions } });

    expect(screen.queryByRole('button', { name: 'Увеличить количество' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /среднее/ }));

    expect(screen.getByRole('button', { name: 'Увеличить количество' })).toBeInTheDocument();
  });

  it('tapping the active portion again deselects it and hides the stepper', async () => {
    const user = userEvent.setup();
    renderQuantity({ quantity: 0, product: { portions } });

    await user.click(screen.getByRole('radio', { name: /среднее/ }));
    expect(screen.getByRole('button', { name: 'Увеличить количество' })).toBeInTheDocument();

    // Second tap on the same portion clears the selection.
    await user.click(screen.getByRole('radio', { name: /среднее/ }));
    expect(screen.queryByRole('button', { name: 'Увеличить количество' })).not.toBeInTheDocument();
  });

  it('increasing the multiplier scales the active portion grams', async () => {
    const user = userEvent.setup();
    const { updateQuantity } = renderQuantity({ quantity: 0, product: { portions } });

    await user.click(screen.getByRole('radio', { name: /среднее/ }));
    // "+" → multiplier 1.5 → round(50 × 1.5) = 75
    await user.click(screen.getByRole('button', { name: 'Увеличить количество' }));

    expect(updateQuantity).toHaveBeenLastCalledWith(75);
  });

  it('shows a ×N readout derived from grams, not a stored multiplier', async () => {
    const user = userEvent.setup();
    renderQuantity({ quantity: 0, product: { portions } });

    await user.click(screen.getByRole('radio', { name: /среднее/ }));
    expect(screen.getByText('×1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Увеличить количество' }));
    expect(screen.getByText('×1.5')).toBeInTheDocument();
  });

  it('decreasing below half a portion is floored at ×0.5', async () => {
    const user = userEvent.setup();
    const { updateQuantity } = renderQuantity({ quantity: 0, product: { portions } });

    await user.click(screen.getByRole('radio', { name: /среднее/ }));
    // ×1 → "−" → ×0.5 → 25
    await user.click(screen.getByRole('button', { name: 'Уменьшить количество' }));
    expect(updateQuantity).toHaveBeenLastCalledWith(25);

    // Already at the floor — another "−" stays at ×0.5 (25).
    await user.click(screen.getByRole('button', { name: 'Уменьшить количество' }));
    expect(updateQuantity).toHaveBeenLastCalledWith(25);
  });
});
