import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import ProductQuantity from './ProductQuantity';
import type { Portion } from './ProductQuantity';

const portions: Portion[] = [
  { label: 'среднее', grams: 50, amount: 1, unit: 'шт' },
  { label: 'крупное', grams: 63, amount: 1, unit: 'шт' },
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

// ─── portions carousel visibility ────────────────────────────────────────────

describe('ProductQuantity — portions visibility', () => {
  it('does not show portions section when no portions provided', () => {
    renderQuantity();
    expect(screen.queryByText('Порции')).not.toBeInTheDocument();
  });

  it('shows portions section when product has portions', () => {
    renderQuantity({ product: { portions } });
    expect(screen.getByText('Порции')).toBeInTheDocument();
    expect(screen.getByText('среднее (50г)')).toBeInTheDocument();
    expect(screen.getByText('крупное (63г)')).toBeInTheDocument();
  });

  it('shows portions section when dish has portions', () => {
    renderQuantity({ dish: { portions } });
    expect(screen.getByText('Порции')).toBeInTheDocument();
  });

  it('always shows quantity section', () => {
    renderQuantity();
    expect(screen.getByText('Количество')).toBeInTheDocument();
  });
});

// ─── additive tap logic ──────────────────────────────────────────────────────

describe('ProductQuantity — additive taps', () => {
  it('first tap sets value to portion grams', async () => {
    const user = userEvent.setup();
    const { updateQuantity } = renderQuantity({ quantity: 100, product: { portions } });

    await user.click(screen.getByText('среднее (50г)'));

    expect(updateQuantity).toHaveBeenLastCalledWith(50);
  });

  it('second tap on same portion adds grams', async () => {
    const user = userEvent.setup();
    const { updateQuantity } = renderQuantity({ quantity: 0, product: { portions } });

    const btn = screen.getByText('среднее (50г)');
    await user.click(btn);
    expect(updateQuantity).toHaveBeenLastCalledWith(50);

    // After first click, button label updates to show count
    const btn2 = screen.getByRole('button', { name: /среднее/ });
    await user.click(btn2);
    expect(updateQuantity).toHaveBeenLastCalledWith(100);
  });

  it('third tap adds another portion', async () => {
    const user = userEvent.setup();
    const { updateQuantity } = renderQuantity({ quantity: 0, product: { portions } });

    const getBtn = () =>
      screen.getAllByRole('button').find((b) => b.textContent?.includes('среднее'))!;

    await user.click(getBtn());
    await user.click(getBtn());
    await user.click(getBtn());

    expect(updateQuantity).toHaveBeenLastCalledWith(150);
  });

  it('tapping a different portion resets to that portion grams', async () => {
    const user = userEvent.setup();
    const { updateQuantity } = renderQuantity({ quantity: 0, product: { portions } });

    // Tap среднее twice = 100
    const getMiddle = () =>
      screen.getAllByRole('button').find((b) => b.textContent?.includes('среднее'))!;
    await user.click(getMiddle());
    await user.click(getMiddle());
    expect(updateQuantity).toHaveBeenLastCalledWith(100);

    // Tap крупное → resets to 63
    const getLarge = () =>
      screen.getAllByRole('button').find((b) => b.textContent?.includes('крупное'))!;
    await user.click(getLarge());
    expect(updateQuantity).toHaveBeenLastCalledWith(63);
  });

  it('tapping a fixed quantity button clears active portion', async () => {
    const user = userEvent.setup();
    const { updateQuantity } = renderQuantity({ quantity: 0, product: { portions } });

    // Tap portion first
    await user.click(screen.getByText('среднее (50г)'));
    expect(updateQuantity).toHaveBeenLastCalledWith(50);

    // Tap fixed quantity 200
    await user.click(screen.getByText('200'));
    expect(updateQuantity).toHaveBeenLastCalledWith(200);

    // Subtitle should revert to "граммы"
    expect(screen.getByText('граммы')).toBeInTheDocument();
  });
});

// ─── dynamic labels ──────────────────────────────────────────────────────────

describe('ProductQuantity — dynamic labels', () => {
  it('shows count on active portion button after multiple taps', async () => {
    const user = userEvent.setup();
    renderQuantity({ quantity: 0, product: { portions } });

    const getBtn = () =>
      screen.getAllByRole('button').find((b) => b.textContent?.includes('среднее'))!;

    await user.click(getBtn());
    await user.click(getBtn());

    expect(getBtn().textContent).toBe('2 × среднее (100г)');
  });

  it('shows portion info in hero subtitle when portion active', async () => {
    const user = userEvent.setup();
    renderQuantity({ quantity: 0, product: { portions } });

    // Initially shows "граммы"
    expect(screen.getByText('граммы')).toBeInTheDocument();

    await user.click(screen.getByText('среднее (50г)'));

    expect(screen.getByText('1 × среднее')).toBeInTheDocument();
    expect(screen.queryByText('граммы')).not.toBeInTheDocument();
  });

  it('updates hero subtitle count on additive taps', async () => {
    const user = userEvent.setup();
    renderQuantity({ quantity: 0, product: { portions } });

    const getBtn = () =>
      screen.getAllByRole('button').find((b) => b.textContent?.includes('среднее'))!;

    await user.click(getBtn());
    expect(screen.getByText('1 × среднее')).toBeInTheDocument();

    await user.click(getBtn());
    expect(screen.getByText('2 × среднее')).toBeInTheDocument();

    await user.click(getBtn());
    expect(screen.getByText('3 × среднее')).toBeInTheDocument();
  });

  it('inactive portion keeps default label', async () => {
    const user = userEvent.setup();
    renderQuantity({ quantity: 0, product: { portions } });

    // Tap среднее
    await user.click(screen.getByText('среднее (50г)'));

    // крупное should still show default label
    expect(screen.getByText('крупное (63г)')).toBeInTheDocument();
  });
});

// ─── fixed quantity buttons ──────────────────────────────────────────────────

describe('ProductQuantity — fixed quantity buttons', () => {
  it('sets value directly when clicking a fixed quantity', async () => {
    const user = userEvent.setup();
    const { updateQuantity } = renderQuantity({ quantity: 0 });

    await user.click(screen.getByText('100'));
    expect(updateQuantity).toHaveBeenLastCalledWith(100);
  });

  it('highlights active fixed quantity button', async () => {
    const user = userEvent.setup();
    renderQuantity({ quantity: 0 });

    const btn = screen.getByText('100');
    await user.click(btn);

    expect(btn.closest('button')).toHaveClass('is-selected');
  });
});
