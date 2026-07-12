// @vitest-environment jsdom
// ProductDrawer — родная обвязка DrawerLayout + меню под карандашом.
// Покрывает инварианты рефактора 2026-06-09 (project_product_drawer_chrome):
//  • заголовок/«мой продукт»/карандаш едут в обвязку (title/subtitle/topRight);
//  • карандаш → drop-down: rename = <label htmlFor> (iOS focus-делегация,
//    feedback_ios_focus), нутриенты = кнопка → инлайн-режим правки (без модалки);
//  • focus на rename-input → ChangeNameModal (handleNameFocusCapture);
//  • БАД: «Состав на одну единицу» + нет Select количества;
//  • каталог: ни карандаша, ни «мой продукт».
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

const h = vi.hoisted(() => ({
  product: { id: 'p1', name: 'магний', servingBasis: '100g' as '100g' | 'serving' },
  isUser: true,
  // Непустой состав по умолчанию → дровер в filled-режиме (measureRow + таблица).
  // Пустой состав теперь показывает empty-state CTA (см. отдельный кейс).
  nutrients: [{ nutrientId: '1', quantity: 10 }] as { nutrientId: string; quantity: number }[],
}));

// DrawerLayout — раскладываем пропы в queryable testid'ы (тестируем ЧТО
// ProductDrawer кладёт в обвязку, не саму обвязку).
vi.mock('@/shared/ui/DrawerLayout', () => ({
  DrawerLayout: ({
    title,
    subtitle,
    topRight,
    children,
  }: {
    title?: ReactNode;
    subtitle?: ReactNode;
    topRight?: ReactNode;
    children?: ReactNode;
  }) => (
    <div>
      <div data-testid="title">{title}</div>
      <div data-testid="subtitle">{subtitle}</div>
      <div data-testid="topright">{topRight}</div>
      {children}
    </div>
  ),
}));
vi.mock('@/entities/product', () => ({
  useProduct: () => h.product,
  useProductPortions: () => [],
  useProductNutrients: () => ({ results: h.nutrients }),
  setProductNutrients: vi.fn(),
  setProductPortions: vi.fn(),
  updateProduct: vi.fn(),
}));
// Keep `allNutrientsList` empty (the test doesn't exercise the nutrient list),
// but pass the rest of the module through so every real export the graph pulls
// (e.g. `nutrientGroups`) stays defined.
vi.mock('@/entities/nutrient/ui/NutrientGroup/constants', async (importActual) => ({
  ...(await importActual<typeof import('@/entities/nutrient/ui/NutrientGroup/constants')>()),
  allNutrientsList: [],
}));
// Nutrient list boundaries (view + edit) — both stub to the same testid so the
// «view vs edit vs empty-state» assertions stay unchanged after NutrientTable
// dissolved into these entity compositions.
vi.mock('@/entities/nutrient/ui/NutrientMeterView', () => ({
  NutrientMeterView: () => <div data-testid="nutrient-table" />,
}));
vi.mock('@/entities/nutrient/ui/NutrientEditView', () => ({
  NutrientEditView: () => <div data-testid="nutrient-table" />,
}));
vi.mock('@/shared/ui/atoms/input/NumberInput', () => ({
  NumberInput: () => <input data-testid="number-input" />,
}));
vi.mock('@/shared/ui/atoms/Select', () => ({
  Select: ({ ariaLabel }: { ariaLabel?: string }) => (
    <div data-testid="quantity-select" aria-label={ariaLabel} />
  ),
}));
vi.mock('@/shared/ui/atoms/icons/PlusIcon', () => ({ PlusIcon: () => <svg /> }));
vi.mock('@/features/dailyNorms/DailyNormButton', () => ({
  DailyNormButton: ({ className }: { className?: string }) => (
    <button data-testid="norm" className={className}>norm</button>
  ),
}));
vi.mock('@/features/food/food-portions-manager', () => ({
  FoodPortionsManager: () => <div data-testid="portions-manager" />,
}));
vi.mock('@/features/shared/change-name', () => ({
  CHANGE_NAME_INPUT_ID: 'change-name-input',
  ChangeNameModal: ({ isExpanded }: { isExpanded?: boolean }) => (
    <div data-testid="rename-modal" data-expanded={String(isExpanded)}>
      <input id="change-name-input" data-testid="rename-input" />
    </div>
  ),
}));
vi.mock('@/features/shared/item-actions-drawer/ItemActionsDrawer', () => ({
  ItemActionsDrawer: () => null,
}));
vi.mock('@/shared/ui/SuggestActionButton', () => ({
  SuggestActionButton: ({
    label,
    onClick,
    disabled,
  }: {
    label?: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  ),
}));
// Suggest-nutrients call — hoisted so tests can drive its resolve/reject and
// inspect the requestId each tap forwarded (fix D2: empty result must NOT reuse
// the id, a lost response must).
const suggestMock = vi.hoisted(() => vi.fn());
vi.mock('./suggestProductNutrients', () => ({
  suggestProductNutrients: suggestMock,
}));
vi.mock('@/shared/ui/drawer-store', () => ({ drawerStore: { show: vi.fn() } }));
vi.mock('@/shared/lib', () => ({ isCreatedByUser: () => h.isUser }));
vi.mock('@/shared/lib/safeMutate', () => ({ safeMutate: (fn: () => unknown) => fn() }));
vi.mock('@/shared/assets/icons/edit.svg?react', () => ({
  default: () => <svg data-testid="edit-icon" />,
}));
vi.mock('./ProductDrawer.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `pd-${String(p)}` }),
}));
import { ProductDrawer } from './ProductDrawer';

describe('ProductDrawer — chrome + edit menu', () => {
  beforeEach(() => {
    h.product = { id: 'p1', name: 'магний', servingBasis: '100g' };
    h.isUser = true;
    h.nutrients = [{ nutrientId: '1', quantity: 10 }];
  });

  it('puts the capitalized name in the chrome title and «мой продукт» in subtitle', () => {
    const { getByTestId } = render(<ProductDrawer productId="p1" onClose={() => {}} />);
    expect(getByTestId('title').textContent).toBe('Магний');
    expect(getByTestId('subtitle').textContent).toContain('мой продукт');
  });

  it('pencil opens a menu: rename is a <label htmlFor> (iOS), nutrients is a button', () => {
    const { getByLabelText, getByText, queryByText } = render(<ProductDrawer productId="p1" onClose={() => {}} />);
    expect(queryByText('Редактировать название')).toBeNull(); // closed by default
    fireEvent.click(getByLabelText('Редактировать продукт'));
    // iOS keyboard contract: rename trigger MUST be a <label htmlFor=input-id>.
    // The label text now lives in a nested <Text as="span">, so walk up to the
    // owning menu-item element.
    const renameLabel = getByText('Редактировать название').closest('label');
    expect(renameLabel).not.toBeNull();
    expect(renameLabel!.getAttribute('for')).toBe('change-name-input');
    // Nutrients is a plain onClick menu-item — NOT a focus-delegation label.
    expect(getByText('Редактировать нутриенты').closest('label')).toBeNull();
  });

  it('«Редактировать нутриенты» enters inline edit mode (header «Редактирование» + editable table)', () => {
    const { getByLabelText, getByText, queryByText, getByTestId } = render(<ProductDrawer productId="p1" onClose={() => {}} />);
    expect(queryByText('Редактирование')).toBeNull(); // не в режиме правки по умолчанию
    fireEvent.click(getByLabelText('Редактировать продукт'));
    fireEvent.click(getByText('Редактировать нутриенты'));
    // Инлайн-режим: появляется шапка «Редактирование» + таблица в режиме инпутов
    // (отдельной модалки больше нет).
    expect(getByText('Редактирование')).not.toBeNull();
    expect(getByTestId('nutrient-table')).not.toBeNull();
  });

  it('focusing the rename input opens ChangeNameModal (focus-delegation handler)', () => {
    const { getByTestId } = render(<ProductDrawer productId="p1" onClose={() => {}} />);
    expect(getByTestId('rename-modal').getAttribute('data-expanded')).toBe('false');
    fireEvent.focus(getByTestId('rename-input'));
    expect(getByTestId('rename-modal').getAttribute('data-expanded')).toBe('true');
  });

  it('food (user) renders the quantity Select (50/50 measure row)', () => {
    const { getByLabelText } = render(<ProductDrawer productId="p1" onClose={() => {}} />);
    expect(getByLabelText('Способ измерения количества')).not.toBeNull();
  });

  it('supplement shows «Состав на одну единицу» and no quantity Select', () => {
    h.product = { id: 'p1', name: 'витамин д', servingBasis: 'serving' };
    const { getByText, queryByLabelText } = render(<ProductDrawer productId="p1" onClose={() => {}} />);
    expect(getByText('Состав на одну единицу:')).not.toBeNull();
    expect(queryByLabelText('Способ измерения количества')).toBeNull();
  });

  it('empty nutrients (user product): shows the suggest CTA + manual link, hides the measure row', () => {
    h.nutrients = [];
    const { getByText, queryByLabelText, queryByTestId } = render(
      <ProductDrawer productId="p1" onClose={() => {}} />,
    );
    expect(getByText('Предложить нутриенты')).not.toBeNull();
    expect(getByText('Ввести вручную')).not.toBeNull();
    // measureRow/норму/таблицу прячем — скейлить нечего.
    expect(queryByLabelText('Способ измерения количества')).toBeNull();
    expect(queryByTestId('nutrient-table')).toBeNull();
  });

  it('catalog product: no edit pencil and no «мой продукт» subtitle', () => {
    h.isUser = false;
    const { queryByLabelText, getByTestId } = render(<ProductDrawer productId="p1" onClose={() => {}} />);
    expect(queryByLabelText('Редактировать продукт')).toBeNull();
    expect(getByTestId('subtitle').textContent).toBe('');
  });
});

// Fix D2: the suggest X-Request-Id must be reused only for a genuine same-request
// retry (a LOST response after the server charged). An empty result is a
// COMPLETED, already-charged run — the id must be dropped so the next tap is a
// fresh billable request, not a free dedup.
describe('ProductDrawer — suggest requestId lifecycle (D2)', () => {
  beforeEach(() => {
    h.product = { id: 'p1', name: 'магний', servingBasis: '100g' };
    h.isUser = true;
    h.nutrients = []; // empty state → showcase «Предложить нутриенты» CTA, confirm=false
    suggestMock.mockReset();
  });

  it('mints a FRESH id on the next tap after an empty result (empty = charged, not lost)', async () => {
    suggestMock.mockResolvedValue({}); // empty → no whole-replace, ref cleared
    const { getByText } = render(<ProductDrawer productId="p1" onClose={() => {}} />);

    fireEvent.click(getByText('Предложить нутриенты'));
    await waitFor(() => expect(suggestMock).toHaveBeenCalledTimes(1));
    fireEvent.click(getByText('Предложить нутриенты'));
    await waitFor(() => expect(suggestMock).toHaveBeenCalledTimes(2));

    const id1 = suggestMock.mock.calls[0][1];
    const id2 = suggestMock.mock.calls[1][1];
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id2).not.toBe(id1); // fresh billable request, not a free dedup
  });

  it('REUSES the id on the next tap after a thrown error (lost response → same-request retry)', async () => {
    suggestMock.mockRejectedValue(new Error('network')); // response lost, charge may have landed
    const { getByText } = render(<ProductDrawer productId="p1" onClose={() => {}} />);

    fireEvent.click(getByText('Предложить нутриенты'));
    await waitFor(() => expect(suggestMock).toHaveBeenCalledTimes(1));
    fireEvent.click(getByText('Предложить нутриенты'));
    await waitFor(() => expect(suggestMock).toHaveBeenCalledTimes(2));

    const id1 = suggestMock.mock.calls[0][1];
    const id2 = suggestMock.mock.calls[1][1];
    expect(id1).toBeTruthy();
    expect(id2).toBe(id1); // idempotent retry — server dedups the charge
  });
});
