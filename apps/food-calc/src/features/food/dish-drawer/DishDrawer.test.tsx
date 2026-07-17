import type { ReactNode } from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Хойстед-спаи для замоканных хуков/навигации.
const {
  useDishWithStatus,
  useDishItemsWithProducts,
  useDishNutrientTotals,
  goToPage,
} = vi.hoisted(() => ({
  useDishWithStatus: vi.fn(),
  useDishItemsWithProducts: vi.fn(),
  useDishNutrientTotals: vi.fn(),
  goToPage: vi.fn(),
}));

vi.mock('@/entities/dish', () => ({
  useDishWithStatus,
  useDishItemsWithProducts,
  useDishNutrientTotals,
}));

// Хук навигации возвращает наш спай — так проверяем порядок onClose→navigate.
vi.mock('@/shared/lib/viewTransition', () => ({
  useViewTransitionNavigate: () => goToPage,
}));

// FoodsNutrients — маркер-заглушка (проверяем факт присутствия таблицы нутриентов,
// не её содержимое; тяжёлый DailyNormButton/NutrientTable тут не нужен).
vi.mock('@/widgets/nutrients/FoodsNutrients', () => ({
  FoodsNutrients: () => <div data-testid="foods-nutrients" />,
}));

// DrawerLayout-заглушка: passthrough без Base UI Drawer-контекста. Экспонирует
// title / topRight / body слоты, чтобы ассертить шапку и наличие стрелки.
vi.mock('@/shared/ui/DrawerLayout', () => ({
  DrawerLayout: ({ title, topRight, children }: { title?: ReactNode; topRight?: ReactNode; children?: ReactNode }) => (
    <div>
      <div data-testid="title">{title}</div>
      <div data-testid="top-right">{topRight}</div>
      <div data-testid="body">{children}</div>
    </div>
  ),
}));

import { DishDrawer } from './DishDrawer';

describe('DishDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDishItemsWithProducts.mockReturnValue([]);
    useDishNutrientTotals.mockReturnValue({ totals: {}, missingNutrientNames: [] });
  });

  it('loading → ghost (ни «нет ингредиентов», ни «не найдено»)', () => {
    useDishWithStatus.mockReturnValue({ dish: null, loading: true });
    const { queryByText } = render(<DishDrawer dishId="d1" dishName="борщ" onClose={vi.fn()} />);
    expect(queryByText(/нет ингредиентов/i)).toBeNull();
    expect(queryByText(/не найдено/i)).toBeNull();
  });

  it('missing (loaded, no dish) → сообщение «не найдено» + НЕТ стрелки на страницу', () => {
    useDishWithStatus.mockReturnValue({ dish: null, loading: false });
    const { getByText, queryByLabelText } = render(<DishDrawer dishId="d1" onClose={vi.fn()} />);
    expect(getByText(/не найдено/i)).toBeInTheDocument();
    expect(queryByLabelText('Открыть страницу блюда')).toBeNull();
  });

  it('капитализирует имя блюда в шапке', () => {
    useDishWithStatus.mockReturnValue({ dish: { id: 'd1', name: 'борщ' }, loading: false });
    const { getByTestId } = render(<DishDrawer dishId="d1" onClose={vi.fn()} />);
    expect(getByTestId('title').textContent).toBe('Борщ');
  });

  it('пустое блюдо → empty-state состава, БЕЗ таблицы нутриентов', () => {
    useDishWithStatus.mockReturnValue({ dish: { id: 'd1', name: 'борщ' }, loading: false });
    useDishItemsWithProducts.mockReturnValue([]);
    const { getByText, queryByTestId } = render(<DishDrawer dishId="d1" onClose={vi.fn()} />);
    expect(getByText(/нет ингредиентов/i)).toBeInTheDocument();
    expect(queryByTestId('foods-nutrients')).toBeNull();
  });

  it('блюдо с ингредиентами → ряды состава (капитализ. + округл. граммы) + таблица нутриентов', () => {
    useDishWithStatus.mockReturnValue({ dish: { id: 'd1', name: 'борщ' }, loading: false });
    useDishItemsWithProducts.mockReturnValue([
      { id: 'i1', quantity: 123.4, product: { name: 'свёкла' } },
    ]);
    useDishNutrientTotals.mockReturnValue({ totals: { '1': 10 }, missingNutrientNames: [] });
    const { getByTestId } = render(<DishDrawer dishId="d1" onClose={vi.fn()} />);
    const body = getByTestId('body').textContent ?? '';
    expect(body).toContain('Свёкла');
    expect(body).toContain('123'); // Math.round(123.4)
    expect(getByTestId('foods-nutrients')).toBeInTheDocument();
  });

  it('осиротевший ингредиент (product=null) → фолбэк «Продукт»', () => {
    useDishWithStatus.mockReturnValue({ dish: { id: 'd1', name: 'борщ' }, loading: false });
    useDishItemsWithProducts.mockReturnValue([{ id: 'i1', quantity: 50, product: null }]);
    const { getByTestId } = render(<DishDrawer dishId="d1" onClose={vi.fn()} />);
    expect(getByTestId('body').textContent).toContain('Продукт');
  });

  it('стрелка «на страницу» закрывает дровер ДО навигации (обязательный pop оверлея)', () => {
    useDishWithStatus.mockReturnValue({ dish: { id: 'd1', name: 'борщ' }, loading: false });
    const order: string[] = [];
    const onClose = vi.fn(() => order.push('close'));
    goToPage.mockImplementation(() => order.push('navigate'));
    const { getByLabelText } = render(<DishDrawer dishId="d1" onClose={onClose} />);
    fireEvent.click(getByLabelText('Открыть страницу блюда'));
    expect(order).toEqual(['close', 'navigate']);
  });
});
