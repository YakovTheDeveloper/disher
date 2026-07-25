// @vitest-environment jsdom
// ProductDrawer — тонкий адаптер над NutrientShowcaseDrawer. Всё редактирование
// уехало на /product/:id; здесь проверяем ТОЛЬКО контракт адаптера: какие имя,
// маршрут страницы, пункты порции и ОТСКЕЙЛЕННЫЕ нутриенты он кладёт в каркас.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';

const h = vi.hoisted(() => ({
  product: {
    id: 'p1',
    name: 'магний',
    servingBasis: '100g' as '100g' | 'serving',
    description: '',
  } as { id: string; name: string; servingBasis: '100g' | 'serving'; description: string } | undefined,
  portions: [] as { label: string; grams: number }[],
  nutrients: [{ nutrientId: '1', quantity: 10 }] as { nutrientId: string; quantity: number }[],
}));

// NutrientShowcaseDrawer — каркас; ловим его пропы (что ИМЕННО кладёт адаптер),
// а не рендерим сам shell. Держим ссылку на последние пропы для драйва селекта.
const qv = vi.hoisted(() => ({ props: null as Record<string, unknown> | null }));
vi.mock('@/features/food/quick-view-drawer', () => ({
  NutrientShowcaseDrawer: (props: Record<string, unknown>) => {
    qv.props = props;
    return <div data-testid="qv" />;
  },
}));
vi.mock('@/entities/product', () => ({
  useProduct: () => h.product,
  useProductPortions: () => h.portions,
  useProductNutrients: () => ({ results: h.nutrients }),
}));

import { ProductDrawer } from './ProductDrawer';

describe('ProductDrawer — NutrientShowcaseDrawer adapter', () => {
  beforeEach(() => {
    h.product = { id: 'p1', name: 'магний', servingBasis: '100g', description: '' };
    h.portions = [];
    h.nutrients = [{ nutrientId: '1', quantity: 10 }];
  });
  afterEach(() => {
    qv.props = null;
  });

  it('name, subtitle, product route, base-100g nutrients', () => {
    render(<ProductDrawer productId="p1" onClose={() => {}} />);
    expect(qv.props!.title).toBe('магний');
    expect(qv.props!.subtitle).toBe('Пищевая ценность');
    expect(qv.props!.pageRoute).toBe('/product/p1');
    expect(qv.props!.hasNutrients).toBe(true);
    // basis '100g', дефолт «На 100 г» → scale 1 → значение как есть.
    expect(qv.props!.nutrients).toEqual({ '1': 10 });
  });

  it('supplement: no portion options, nutrients per one unit', () => {
    h.product = { id: 'p1', name: 'витамин д', servingBasis: 'serving', description: '' };
    render(<ProductDrawer productId="p1" onClose={() => {}} />);
    expect(qv.props!.portionOptions).toEqual([]);
    // basis 'serving', одна единица → scale 1.
    expect(qv.props!.nutrients).toEqual({ '1': 10 });
  });

  it('empty nutrients: hasNutrients false, empty map', () => {
    h.nutrients = [];
    render(<ProductDrawer productId="p1" onClose={() => {}} />);
    expect(qv.props!.hasNutrients).toBe(false);
    expect(qv.props!.nutrients).toEqual({});
  });

  it('ghost while loading: productName feeds the header', () => {
    h.product = undefined;
    render(<ProductDrawer productId="p1" productName="яблоко" onClose={() => {}} />);
    expect(qv.props!.title).toBe('яблоко');
    expect(qv.props!.hasNutrients).toBe(false);
  });

  it('selecting a named portion rescales the nutrients', () => {
    // Порция 200 г → пункт «portion:0»; выбор его удваивает scale (200/100).
    h.portions = [{ label: 'Кусок', grams: 200 }];
    render(<ProductDrawer productId="p1" onClose={() => {}} />);
    // Дефолт «На 100 г».
    expect(qv.props!.nutrients).toEqual({ '1': 10 });
    // «Своё значение» (grams:null) отфильтровано — в опциях только grams-опоры.
    const options = qv.props!.portionOptions as { value: string; grams: number | null }[];
    expect(options.every((o) => o.grams != null)).toBe(true);

    act(() => {
      (qv.props!.onSelectPortion as (v: string) => void)('portion:0');
    });
    expect(qv.props!.nutrients).toEqual({ '1': 20 });
  });
});
