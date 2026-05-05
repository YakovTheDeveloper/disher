import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import FoodsNutrients from './FoodsNutrients';
import type { NutrientTotals } from '@/shared/lib/nutrients';

// ─── mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/shared/ui/Screen', () => ({
  Screen: ({ children, bottomRight, actions }: {
    children: React.ReactNode;
    bottomRight?: React.ReactNode;
    actions?: React.ReactNode;
  }) => (
    <div>
      <div data-testid="bottom-right">{bottomRight}</div>
      <div data-testid="actions-slot">{actions}</div>
      {children}
    </div>
  ),
}));

// Renders renderCard for two nutrients so we can assert on values
vi.mock('@/entities/nutrient/ui/NutrientGroup', () => ({
  Nutrients: ({ renderCard }: { renderCard: (n: any) => React.ReactNode }) => (
    <div data-testid="nutrients-list">
      {renderCard({ id: '7', name: 'energy', displayName: 'kcal', displayNameRu: 'Энергия', unit: 'kcal', unitRu: 'ккал', symbol: 'kcal', group: 'main' })}
      {renderCard({ id: '1', name: 'protein', displayName: 'Protein', displayNameRu: 'Белки', unit: 'g', unitRu: 'г', symbol: 'PRO', group: 'main' })}
    </div>
  ),
}));

vi.mock('@/features/dailyNorms/OpenDailyNorms', () => ({
  OpenDailyNorms: () => <div data-testid="open-daily-norms" />,
}));

vi.mock('@/shared/ui/atoms/Button', () => ({
  FilterButton: ({ onClick, isActive }: { onClick: () => void; isActive: boolean }) => (
    <button
      data-testid="filter-button"
      data-active={String(isActive)}
      onClick={onClick}
    >
      Filter
    </button>
  ),
}));

// Exposes getValue result via data-value so tests can assert on it
vi.mock('@/entities/nutrient/ui/NutrientCard', () => ({
  NutrientCard: ({ content, getValue }: { content: { id: string; displayNameRu: string }; getValue: (id: string) => number }) => (
    <div
      data-testid={`nutrient-card-${content.id}`}
      data-value={String(getValue(content.id))}
    >
      {content.displayNameRu}
    </div>
  ),
  NutrientCardEditor: ({ content, getValue }: { content: { id: string; displayNameRu: string }; getValue: (id: string) => number }) => (
    <div
      data-testid={`nutrient-card-${content.id}`}
      data-value={String(getValue(content.id))}
    >
      {content.displayNameRu}
    </div>
  ),
}));

// Keep useFilterNutrients real so filter state tests work; mock only UI wrappers
vi.mock('@/features/nutrients/filter-nutrients', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/nutrients/filter-nutrients')>();
  return {
    ...actual,
    FilterNutrientCardWrapper: ({ renderCard }: { renderCard: (overrides: Record<string, unknown>) => React.ReactNode }) => <div>{renderCard({})}</div>,
    FilterNutrientsPanel: () => <div data-testid="filter-panel" />,
  };
});

vi.mock('./OpenRichFood', () => ({
  default: () => null,
}));

vi.mock('@/shared/ui/Ornament', () => ({
  Ornament: ({ text }: { text: string }) => (
    <div data-testid={`ornament-${text}`}>{text}</div>
  ),
}));

// ─── tests ───────────────────────────────────────────────────────────────────

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

  it('renders ornament sections', () => {
    render(<FoodsNutrients totals={{}} />);
    expect(screen.getByTestId('ornament-нутриенты')).toBeInTheDocument();
    expect(screen.getByTestId('ornament-дневная норма')).toBeInTheDocument();
  });

  it('renders OpenDailyNorms section', () => {
    render(<FoodsNutrients totals={{}} />);
    expect(screen.getByTestId('open-daily-norms')).toBeInTheDocument();
  });

  it('renders the after slot content', () => {
    render(
      <FoodsNutrients totals={{}} after={<div data-testid="after-slot" />} />,
    );
    expect(screen.getByTestId('after-slot')).toBeInTheDocument();
  });

  it('does not render after slot when prop is omitted', () => {
    render(<FoodsNutrients totals={{}} />);
    expect(screen.queryByTestId('after-slot')).not.toBeInTheDocument();
  });
});

// ─── filter mode ─────────────────────────────────────────────────────────────

describe('FoodsNutrients — filter mode', () => {
  it('FilterButton starts with isActive=false', () => {
    render(<FoodsNutrients totals={{}} />);
    expect(screen.getByTestId('filter-button')).toHaveAttribute('data-active', 'false');
  });

  it('clicking FilterButton activates filter mode', async () => {
    const user = userEvent.setup();
    render(<FoodsNutrients totals={{}} />);

    await user.click(screen.getByTestId('filter-button'));

    expect(screen.getByTestId('filter-button')).toHaveAttribute('data-active', 'true');
  });

  it('shows FilterNutrientsPanel when filter mode is active', async () => {
    const user = userEvent.setup();
    render(<FoodsNutrients totals={{}} />);

    expect(screen.queryByTestId('filter-panel')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('filter-button'));

    expect(screen.getByTestId('filter-panel')).toBeInTheDocument();
  });

  it('hides FilterNutrientsPanel when filter mode is toggled off', async () => {
    const user = userEvent.setup();
    render(<FoodsNutrients totals={{}} />);

    await user.click(screen.getByTestId('filter-button')); // on
    await user.click(screen.getByTestId('filter-button')); // off

    expect(screen.queryByTestId('filter-panel')).not.toBeInTheDocument();
  });
});
