/* eslint-disable @typescript-eslint/no-explicit-any -- lightweight test-mock props */
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import DishProductEditModals from './DishProductEditModals';
import type { DishProductFlow } from '../useDishProductFlow';

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// ─── mocks (heavy children stubbed so the test exercises only the shell) ──────
vi.mock('@/features/food/food-search', () => ({
  SearchFood: (props: any) => (
    <div data-testid="search-food">
      <input id={props.inputId} data-testid="search-input" />
    </div>
  ),
}));
vi.mock('@/features/product/ProductQuantity', () => ({
  ProductQuantity: (props: any) => (
    <div data-testid="product-quantity">
      <input id={props.inputId} data-testid="quantity-input" />
    </div>
  ),
}));
vi.mock('@/features/food/details-chips', () => ({
  DetailsChips: (props: any) => (
    <div data-testid="details-chips">
      <textarea id={props.textareaId} data-testid="details-textarea" value={props.value} readOnly />
    </div>
  ),
}));

// ─── flow fixture ─────────────────────────────────────────────────────────────
// The edit modals consume a `flow` object (ReturnType of useDishProductFlow).
// We hand-build it instead of calling the hook so the test isolates the
// title-rendering branch the refactor touched.
const makeFlow = (overrides: Partial<DishProductFlow> = {}): DishProductFlow =>
  ({
    step: 'details',
    draft: { productId: 'prod-1', foodName: null, quantity: 100, details: 'тёртая' },
    setDraft: vi.fn(),
    setStep: vi.fn(),
    editingItem: {
      id: 'item-1',
      productId: 'prod-1',
      quantity: 100,
      details: 'тёртая',
      product: { name: 'Морковь' },
    },
    startEdit: vi.fn(),
    primeEdit: vi.fn(),
    sessionKey: 0,
    visitedSteps: [],
    handleFocusCapture: vi.fn(),
    handleClose: vi.fn(),
    handleFoodSelect: vi.fn(),
    handlePickCreate: vi.fn(),
    handleConfirmCreate: vi.fn(),
    handleCommit: vi.fn(),
    quantityContent: { quantity: 100, updateQuantity: vi.fn(), product: { portions: [] } },
    inputIds: {
      SEARCH_INPUT: 'dish-item-edit-search',
      QUANTITY_INPUT: 'dish-item-edit-quantity',
      DETAILS_INPUT: 'dish-item-edit-details',
      CREATE_INPUT: 'dish-item-create-name',
    },
    ...overrides,
  }) as DishProductFlow;

const expanded = (): HTMLElement => {
  const node = document.querySelector('[data-modal-by-label="expanded"]');
  if (!node) throw new Error('No expanded ModalByLabel in document');
  return node as HTMLElement;
};

// ─── tests ────────────────────────────────────────────────────────────────────
// The edit entry point is tap-on-name on a dish-item row. Requirement (user,
// 2026-06-01): the details modal header in EDIT shows the product name itself —
// not the old "Уточнение: <name>" prefixed form, and not the create-flow steps
// header (which carries no entity title).

describe('DishProductEditModals — details header title', () => {
  it('shows the product name as the header title (no "Уточнение:" prefix)', () => {
    render(<DishProductEditModals flow={makeFlow()} />);
    const header = expanded().querySelector('header');
    expect(header).not.toBeNull();
    expect(header!.textContent).toContain('Морковь');
    // Regression guard: the pre-refactor title was `Уточнение: Морковь`.
    expect(header!.textContent).not.toContain('Уточнение:');
  });

  it('falls back to "Уточнение к ингредиенту" when the product has no name', () => {
    const flow = makeFlow({
      editingItem: {
        id: 'item-1',
        productId: 'prod-1',
        quantity: 100,
        details: '',
        product: { name: null },
      },
    });
    render(<DishProductEditModals flow={flow} />);
    expect(expanded().querySelector('header')!.textContent).toContain(
      'Уточнение к ингредиенту',
    );
  });

  it('commits via the "Готово" button in the details header modal', () => {
    const handleCommit = vi.fn();
    render(<DishProductEditModals flow={makeFlow({ handleCommit })} />);
    const commit = Array.from(expanded().querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Готово',
    );
    expect(commit).toBeDefined();
    fireEvent.click(commit!);
    expect(handleCommit).toHaveBeenCalledTimes(1);
  });
});
