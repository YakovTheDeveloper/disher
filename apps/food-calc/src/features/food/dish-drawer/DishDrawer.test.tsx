import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

type SelectOpt = { value: string; label: string };
type CapturedProps = {
  title: string;
  subtitle: string;
  pageRoute: string;
  heroName?: string;
  portionOptions: SelectOpt[];
  selectedPortion: string;
  onSelectPortion: (value: string) => void;
  nutrients: Record<string, number>;
  hasNutrients: boolean;
  loading?: boolean;
};

// Хойстед-спаи хуков блюда + холдер последних props, отданных NutrientShowcaseDrawer.
const { useDishWithStatus, useDishItemsWithProducts, useDishNutrientTotals, useDishPortions, h } =
  vi.hoisted(() => ({
    useDishWithStatus: vi.fn(),
    useDishItemsWithProducts: vi.fn(),
    useDishNutrientTotals: vi.fn(),
    useDishPortions: vi.fn(),
    h: { props: null as unknown as CapturedProps },
  }));

vi.mock('@/entities/dish', () => ({
  useDishWithStatus,
  useDishItemsWithProducts,
  useDishNutrientTotals,
  useDishPortions,
}));

// NutrientShowcaseDrawer — заглушка: перехватывает props (адаптер лишь поставляет данные)
// и рендерит кнопку на каждый пункт порции, чтобы дёрнуть onSelectPortion в тесте.
vi.mock('@/features/food/quick-view-drawer', () => ({
  NutrientShowcaseDrawer: (props: CapturedProps) => {
    h.props = props;
    return (
      <div>
        {props.portionOptions.map((o) => (
          <button key={o.value} onClick={() => props.onSelectPortion(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    );
  },
}));

import { DishDrawer } from './DishDrawer';

describe('DishDrawer (адаптер NutrientShowcaseDrawer)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.props = null as unknown as CapturedProps;
    useDishWithStatus.mockReturnValue({ dish: { id: 'd1', name: 'борщ' }, loading: false });
    useDishItemsWithProducts.mockReturnValue([]);
    useDishNutrientTotals.mockReturnValue({ totals: {}, missingNutrientNames: [] });
    useDishPortions.mockReturnValue([]);
  });

  it('передаёт имя / подзаголовок / маршрут страницы', () => {
    render(<DishDrawer dishId="d1" onClose={vi.fn()} />);
    expect(h.props.title).toBe('борщ');
    expect(h.props.subtitle).toBe('Пищевая ценность');
    expect(h.props.pageRoute).toBe('/dish/d1');
    expect(h.props.heroName).toBe('борщ');
  });

  it('загрузка → имя-«призрак» из dishName, без нутриентов, loading прокинут (ghost, без ложной подсказки)', () => {
    useDishWithStatus.mockReturnValue({ dish: null, loading: true });
    render(<DishDrawer dishId="d1" dishName="борщ" onClose={vi.fn()} />);
    expect(h.props.title).toBe('борщ');
    expect(h.props.hasNutrients).toBe(false);
    // Регресс: пока блюдо грузится, shell должен держать ghost (loading=true),
    // а не мигать «Добавить нутриенты можно на странице» на непустом блюде.
    expect(h.props.loading).toBe(true);
  });

  it('блюдо загружено → loading=false (подсказка «нет нутриентов» допустима на реально пустом)', () => {
    useDishWithStatus.mockReturnValue({ dish: { id: 'd1', name: 'борщ' }, loading: false });
    render(<DishDrawer dishId="d1" onClose={vi.fn()} />);
    expect(h.props.loading).toBe(false);
  });

  it('пустое блюдо → hasNutrients=false, без пунктов порции', () => {
    render(<DishDrawer dishId="d1" onClose={vi.fn()} />);
    expect(h.props.hasNutrients).toBe(false);
    expect(h.props.portionOptions).toEqual([]);
  });

  it('блюдо с ингредиентами → «Всё блюдо» первым + каждая dish_portion; дефолт «Всё блюдо»', () => {
    useDishItemsWithProducts.mockReturnValue([
      { id: 'i1', productId: 'p1', quantity: 200, product: { name: 'свёкла' } },
    ]);
    useDishNutrientTotals.mockReturnValue({ totals: { '1': 10 }, missingNutrientNames: [] });
    useDishPortions.mockReturnValue([{ id: 'x', dish_id: 'd1', label: 'Половина', grams: 100 }]);
    render(<DishDrawer dishId="d1" onClose={vi.fn()} />);
    expect(h.props.hasNutrients).toBe(true);
    expect(h.props.portionOptions.map((o: { value: string }) => o.value)).toEqual([
      'Всё блюдо',
      'Половина',
    ]);
    expect(h.props.selectedPortion).toBe('Всё блюдо');
    // «Всё блюдо» = весь вес → нутриенты равны суммарным totals (scale 1).
    expect(h.props.nutrients).toEqual({ '1': 10 });
  });

  it('выбор порции скейлит нутриенты по grams / totalWeight', () => {
    useDishItemsWithProducts.mockReturnValue([
      { id: 'i1', productId: 'p1', quantity: 200, product: { name: 'свёкла' } },
    ]);
    useDishNutrientTotals.mockReturnValue({ totals: { '1': 10 }, missingNutrientNames: [] });
    useDishPortions.mockReturnValue([{ id: 'x', dish_id: 'd1', label: 'Половина', grams: 100 }]);
    const { getByText } = render(<DishDrawer dishId="d1" onClose={vi.fn()} />);
    // 100 г из 200 г всего → scale 0.5.
    fireEvent.click(getByText('Половина'));
    expect(h.props.selectedPortion).toBe('Половина');
    expect(h.props.nutrients).toEqual({ '1': 5 });
  });
});
