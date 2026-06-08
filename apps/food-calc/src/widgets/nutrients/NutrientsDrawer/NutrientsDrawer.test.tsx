// NutrientsDrawer — store-driven nutrient breakdown drawer. После консолидации
// нормы (2026-06) дровер больше не редактирует норму внутри себя: он просто
// рендерит заголовок + FoodsNutrients. Норма живёт в DailyNormButton вверху
// FoodsNutrients и открывает отдельный DailyNormDrawer. DrawerLayout и
// FoodsNutrients застаблены; проверяем заголовок + viewTitle-override.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';

vi.mock('@/shared/ui/DrawerLayout', () => ({
  DrawerLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/widgets/nutrients/FoodsNutrients', () => ({
  FoodsNutrients: () => <div data-testid="foods-nutrients" />,
}));

const { NutrientsDrawer } = await import('./NutrientsDrawer');

const noop = () => {};

describe('NutrientsDrawer', () => {
  it('shows the «Нутриенты» title and the nutrient list', () => {
    render(<NutrientsDrawer onClose={noop} totals={{}} />);

    expect(screen.getByRole('heading', { name: 'Нутриенты' })).toBeInTheDocument();
    expect(screen.getByTestId('foods-nutrients')).toBeInTheDocument();
  });

  it('renders viewTitle instead of «Нутриенты» when provided (catalog product)', () => {
    render(<NutrientsDrawer onClose={noop} totals={{}} viewTitle="абрикос" />);

    expect(screen.getByRole('heading', { name: 'абрикос' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Нутриенты' })).not.toBeInTheDocument();
  });
});
