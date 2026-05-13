import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import FoodsNutrients from './FoodsNutrients';
import type { NutrientTotals } from '@/shared/lib/nutrients';

// Mock NutrientDesignVariants to expose getValue() resolution per nutrient id.
vi.mock('./NutrientDesignVariants', () => ({
  default: ({ getValue }: { getValue: (id: string) => number }) => (
    <div data-testid="nutrients-list">
      <div data-testid="nutrient-card-7" data-value={String(getValue('7'))} />
      <div data-testid="nutrient-card-1" data-value={String(getValue('1'))} />
    </div>
  ),
}));

vi.mock('@/shared/ui/atoms/Spinner/Spinner', () => ({
  default: () => <div data-testid="spinner" />,
}));

describe('FoodsNutrients', () => {
  it('renders without crashing with empty totals', () => {
    render(<FoodsNutrients totals={{}} />);
    expect(screen.getByTestId('nutrients-list')).toBeInTheDocument();
  });

  it('passes correct values from totals to cards via getValue', () => {
    const totals: NutrientTotals = { '7': 1850, '1': 95 };
    render(<FoodsNutrients totals={totals} />);

    expect(screen.getByTestId('nutrient-card-7')).toHaveAttribute('data-value', '1850');
    expect(screen.getByTestId('nutrient-card-1')).toHaveAttribute('data-value', '95');
  });

  it('returns 0 from getValue for a nutrient not present in totals', () => {
    render(<FoodsNutrients totals={{}} />);

    expect(screen.getByTestId('nutrient-card-7')).toHaveAttribute('data-value', '0');
    expect(screen.getByTestId('nutrient-card-1')).toHaveAttribute('data-value', '0');
  });

  it('reflects updated totals — different values change card data-value', () => {
    const { rerender } = render(<FoodsNutrients totals={{ '7': 100 }} />);
    expect(screen.getByTestId('nutrient-card-7')).toHaveAttribute('data-value', '100');

    rerender(<FoodsNutrients totals={{ '7': 500 }} />);
    expect(screen.getByTestId('nutrient-card-7')).toHaveAttribute('data-value', '500');
  });

  it('renders spinner only when isLoading=true', () => {
    const { rerender } = render(<FoodsNutrients totals={{}} />);
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();

    rerender(<FoodsNutrients totals={{}} isLoading />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('renders missing-nutrients note only when names are provided', () => {
    const { rerender } = render(<FoodsNutrients totals={{}} />);
    expect(screen.queryByText(/Нет данных о нутриентах/)).not.toBeInTheDocument();

    rerender(<FoodsNutrients totals={{}} missingNutrientNames={['Витамин X', 'Магний']} />);
    expect(screen.getByText(/Нет данных о нутриентах: Витамин X, Магний/)).toBeInTheDocument();
  });
});
