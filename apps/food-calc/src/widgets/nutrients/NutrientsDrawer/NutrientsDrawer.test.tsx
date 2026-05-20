// NutrientsDrawer — store-driven nutrient breakdown drawer. The test isolates
// the drawer's own wiring: how it threads `useNutrientNormSlots` output into a
// title + header action + body, and the `viewTitle` override. DrawerLayout and
// FoodsNutrients are stubbed; `useNutrientNormSlots` is replaced with a faithful
// stateful fake mirroring its real view↔edit contract.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';

vi.mock('@/shared/ui/DrawerLayout', () => ({
  DrawerLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/widgets/nutrients/FoodsNutrients', () => ({
  FoodsNutrients: () => <div data-testid="foods-nutrients" />,
}));

// Faithful fake of useNutrientNormSlots: a two-state hook (view ↔ edit). The
// gear/back buttons flip the mode, exactly like the real headerAction. This
// lets the test drive a real mode switch through NutrientsDrawer's rendering.
vi.mock('@/features/dailyNorms/NutrientNormDrawerControl', async () => {
  const React = await import('react');
  return {
    useNutrientNormSlots: () => {
      const [mode, setMode] = React.useState<'view' | 'edit'>('view');
      return {
        hasNorm: true,
        title: mode === 'view' ? 'Нутриенты' : 'Моя норма',
        headerAction:
          mode === 'view' ? (
            <button onClick={() => setMode('edit')}>gear</button>
          ) : (
            <button onClick={() => setMode('view')}>back</button>
          ),
        bodyContent:
          mode === 'edit' ? <div data-testid="norm-form">norm form</div> : null,
        emptyStateBanner: null,
        devToggle: null,
      };
    },
  };
});

const { NutrientsDrawer } = await import('./NutrientsDrawer');

const noop = () => {};

describe('NutrientsDrawer', () => {
  it('shows the generic «Нутриенты» title and the nutrient list in view mode', () => {
    render(<NutrientsDrawer onClose={noop} totals={{}} />);

    expect(screen.getByRole('heading', { name: 'Нутриенты' })).toBeInTheDocument();
    expect(screen.getByTestId('foods-nutrients')).toBeInTheDocument();
    expect(screen.queryByTestId('norm-form')).not.toBeInTheDocument();
  });

  it('renders viewTitle instead of «Нутриенты» when provided (catalog product)', () => {
    render(<NutrientsDrawer onClose={noop} totals={{}} viewTitle="абрикос" />);

    expect(screen.getByRole('heading', { name: 'абрикос' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Нутриенты' })).not.toBeInTheDocument();
  });

  it('switches to the norm form and the norm title when the gear is tapped', () => {
    render(<NutrientsDrawer onClose={noop} totals={{}} viewTitle="абрикос" />);

    fireEvent.click(screen.getByText('gear'));

    // Edit mode → norm form replaces the nutrient list.
    expect(screen.getByTestId('norm-form')).toBeInTheDocument();
    expect(screen.queryByTestId('foods-nutrients')).not.toBeInTheDocument();
    // viewTitle must yield to the norm-form title once bodyContent is non-null.
    expect(screen.getByRole('heading', { name: 'Моя норма' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'абрикос' })).not.toBeInTheDocument();
  });

  it('returns to the nutrient list when the back action is tapped', () => {
    render(<NutrientsDrawer onClose={noop} totals={{}} />);

    fireEvent.click(screen.getByText('gear'));
    fireEvent.click(screen.getByText('back'));

    expect(screen.getByRole('heading', { name: 'Нутриенты' })).toBeInTheDocument();
    expect(screen.getByTestId('foods-nutrients')).toBeInTheDocument();
    expect(screen.queryByTestId('norm-form')).not.toBeInTheDocument();
  });
});
