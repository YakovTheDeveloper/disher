/* eslint-disable @typescript-eslint/no-explicit-any -- lightweight test-mock props */
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import FoodEntryEditModals from './FoodEntryEditModals';
import { type FoodEntryFlow } from './useFoodEntryFlow';
import { foodEntryInputIds } from './inputIds';

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// ── mocks: heavy children + router/drawer deps stubbed so the test exercises
// only the edit-modal shell (title + step gating). ────────────────────────────
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/shared/lib/viewTransition', () => ({ pushNavigate: vi.fn() }));
vi.mock('@/shared/ui/drawer-store', () => ({ drawerStore: { show: vi.fn() } }));
vi.mock('@/features/food/product-drawer', () => ({ ProductDrawer: () => null }));
vi.mock('@/shared/ui/TimeChoose', () => ({
  TimeChoose: (props: any) => (
    <div data-testid="time-choose">
      <input id={props.inputId} data-testid="time-input" />
    </div>
  ),
}));
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
  DetailsStep: (props: any) => (
    <div data-testid="details-step">
      <textarea id={props.textareaId} data-testid="details-textarea" value={props.value} readOnly />
    </div>
  ),
}));

const baseFlow = (): FoodEntryFlow =>
  ({
    kind: 'dish',
    mode: 'edit',
    step: 'details',
    draft: {
      time: '',
      variant: 'product',
      productId: 'prod-1',
      dishId: null,
      foodName: null,
      quantity: 100,
      details: 'тёртая',
    },
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
    handleTimeFinish: vi.fn(),
    handleFoodSelect: vi.fn(),
    handlePickCreate: vi.fn(),
    handleConfirmCreate: vi.fn(),
    handleCommit: vi.fn(),
    quantityContent: { quantity: 100, updateQuantity: vi.fn(), product: { portions: [] } },
    inputIds: foodEntryInputIds('dish').edit,
  }) as unknown as FoodEntryFlow;

const makeDishFlow = (overrides: Partial<FoodEntryFlow> = {}): FoodEntryFlow =>
  ({ ...baseFlow(), ...overrides }) as FoodEntryFlow;

const makeScheduleFlow = (overrides: Partial<FoodEntryFlow> = {}): FoodEntryFlow =>
  ({
    ...baseFlow(),
    kind: 'schedule',
    draft: { ...baseFlow().draft, time: '09:40', foodName: 'Яблоко' },
    inputIds: foodEntryInputIds('schedule').edit,
    ...overrides,
  }) as FoodEntryFlow;

const expanded = (): HTMLElement => {
  const node = document.querySelector('[data-modal-by-label="expanded"]');
  if (!node) throw new Error('No expanded ModalByLabel in document');
  return node as HTMLElement;
};

describe('FoodEntryEditModals (dish) — details header title', () => {
  it('shows the product name as the header title (no "Уточнение:" prefix)', () => {
    render(<FoodEntryEditModals flow={makeDishFlow()} />);
    const header = expanded().querySelector('header');
    expect(header).not.toBeNull();
    expect(header!.textContent).toContain('Морковь');
    expect(header!.textContent).not.toContain('Уточнение:');
  });

  it('falls back to "Уточнение к ингредиенту" when the product has no name', () => {
    const flow = makeDishFlow({
      editingItem: {
        id: 'item-1',
        productId: 'prod-1',
        quantity: 100,
        details: '',
        product: { name: null },
      },
    });
    render(<FoodEntryEditModals flow={flow} />);
    expect(expanded().querySelector('header')!.textContent).toContain('Уточнение к ингредиенту');
  });

  it('commits via the "Готово" button in the details header modal', () => {
    const handleCommit = vi.fn();
    render(<FoodEntryEditModals flow={makeDishFlow({ handleCommit })} />);
    const commit = Array.from(expanded().querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Готово',
    );
    expect(commit).toBeDefined();
    fireEvent.click(commit!);
    expect(handleCommit).toHaveBeenCalledTimes(1);
  });

  it('does NOT render the schedule-only «Время» step for a dish', () => {
    render(<FoodEntryEditModals flow={makeDishFlow({ step: 'time' })} />);
    expect(document.querySelector('[data-testid="time-choose"]')).toBeNull();
  });
});

describe('FoodEntryEditModals (schedule) — time + info gating', () => {
  it('renders the «Время» step', () => {
    render(<FoodEntryEditModals flow={makeScheduleFlow({ step: 'time' })} />);
    expect(document.querySelector('[data-testid="time-choose"]')).not.toBeNull();
  });

  it('shows the ⓘ product-info button in the details header', () => {
    render(<FoodEntryEditModals flow={makeScheduleFlow({ step: 'details' })} />);
    const info = expanded().querySelector('button[aria-label="Информация о продукте"]');
    expect(info).not.toBeNull();
  });
});
