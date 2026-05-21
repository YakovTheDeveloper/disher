/* eslint-disable @typescript-eslint/no-explicit-any -- lightweight test-mock props */
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import ScheduleFoodCreateModals from './ScheduleFoodCreateModals';
import { SCHEDULE_FOOD_INPUT_IDS } from './useScheduleFoodFlow';

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

vi.mock('@/shared/ui/Swipeable/SwipeableLockContext', () => ({
  useSwipeableLock: vi.fn(),
}));
vi.mock('@/shared/lib/useOverlayHistory', () => ({
  useOverlayHistory: vi.fn(),
}));
vi.mock('@/entities/schedule-food', () => ({
  addScheduleFood: vi.fn().mockResolvedValue('new-id'),
  updateScheduleFood: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/entities/product', () => ({
  useProductPortions: () => [],
  createProduct: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/entities/dish', () => ({
  useDishPortions: () => [],
  createDish: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/shared/lib/safeMutate', () => ({
  safeMutate: async (fn: () => Promise<unknown>) => ({ ok: true, value: await fn() }),
}));
vi.mock('@/shared/lib/emitter/emitter', () => ({
  highlightListItem: vi.fn(),
}));
vi.mock('@/shared/lib/toaster/toaster', () => ({
  default: { success: vi.fn() },
}));
vi.mock('@/features/food/details-chips', () => ({
  useHasDetailsHints: () => false,
  DetailsStep: (props: any) => <div data-testid="details-step" id={props.textareaId} />,
}));
vi.mock('@/features/food/food-search', () => ({
  SearchFood: (props: any) => (
    <div data-testid="search-food">
      <input id={props.inputId} data-testid="search-input" />
      <button data-testid="select-product" onClick={() =>
        props.onSelectFood({ variant: 'product', id: 'p1', name: 'Яблоко' })
      }>
        Яблоко
      </button>
      <button data-testid="pick-create-dish" onClick={() =>
        props.onPickCreate?.('dish', 'Борщ')
      }>
        Создать блюдо
      </button>
      <button data-testid="pick-create-product" onClick={() =>
        props.onPickCreate?.('product', 'Морковь')
      }>
        Создать продукт
      </button>
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
vi.mock('@/shared/ui/TimeChoose', () => ({
  TimeChoose: (props: any) => (
    <div data-testid="time-choose">
      <input id={props.inputId} data-testid="time-input" />
    </div>
  ),
}));

// ── helpers ──────────────────────────────────────────────────────────────────

const expanded = (): HTMLElement => {
  const node = document.querySelector('[data-modal-by-label="expanded"]');
  if (!node) throw new Error('No expanded ModalByLabel in document');
  return node as HTMLElement;
};

const focusInput = (id: string) => {
  const el = document.getElementById(id);
  expect(el).not.toBeNull();
  fireEvent.focus(el!);
};

const clickActiveBack = () => {
  const btn = expanded().querySelector('header button');
  if (!btn) throw new Error('No header back button in active modal');
  fireEvent.click(btn);
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── back-correctness ─────────────────────────────────────────────────────────
// Header back в Steps-bar модалках = переключение на предыдущий шаг по линейному
// порядку stepsForBar. На первом шаге с StepHeader (time) back ведёт на search;
// search — голый SearchFood со своим onBack=handleClose. Opt-in `details`
// (visited) → previous = quantity.

describe('ScheduleFoodCreateModals — header back steps to previous step', () => {
  it('back from the time step returns to search', () => {
    render(<ScheduleFoodCreateModals scheduleId="2026-05-19" />);

    focusInput(SCHEDULE_FOOD_INPUT_IDS.SEARCH_INPUT);
    fireEvent.click(expanded().querySelector('[data-testid="select-product"]')!);
    focusInput(SCHEDULE_FOOD_INPUT_IDS.TIME_CREATE_INPUT);
    expect(expanded().querySelector('[data-testid="time-choose"]')).not.toBeNull();

    clickActiveBack();

    expect(expanded().querySelector('[data-testid="search-food"]')).not.toBeNull();
  });

  it('back from the quantity step returns to time', () => {
    render(<ScheduleFoodCreateModals scheduleId="2026-05-19" />);

    focusInput(SCHEDULE_FOOD_INPUT_IDS.SEARCH_INPUT);
    fireEvent.click(expanded().querySelector('[data-testid="select-product"]')!);
    focusInput(SCHEDULE_FOOD_INPUT_IDS.TIME_CREATE_INPUT);
    focusInput(SCHEDULE_FOOD_INPUT_IDS.QUANTITY_CREATE_INPUT);
    expect(expanded().querySelector('[data-testid="product-quantity"]')).not.toBeNull();

    clickActiveBack();

    expect(expanded().querySelector('[data-testid="time-choose"]')).not.toBeNull();
  });

  it('back from the opt-in details step returns to quantity', () => {
    render(<ScheduleFoodCreateModals scheduleId="2026-05-19" />);

    focusInput(SCHEDULE_FOOD_INPUT_IDS.SEARCH_INPUT);
    fireEvent.click(expanded().querySelector('[data-testid="select-product"]')!);
    focusInput(SCHEDULE_FOOD_INPUT_IDS.TIME_CREATE_INPUT);
    focusInput(SCHEDULE_FOOD_INPUT_IDS.QUANTITY_CREATE_INPUT);
    focusInput(SCHEDULE_FOOD_INPUT_IDS.DETAILS_INPUT);
    expect(expanded().querySelector('[data-testid="details-step"]')).not.toBeNull();

    clickActiveBack();

    expect(expanded().querySelector('[data-testid="product-quantity"]')).not.toBeNull();
  });
});

// Русский падеж: variantLabel 'блюдо' (ср.р.) → «Новое блюдо», 'продукт'
// (м.р.) → «Новый продукт». Раньше тут была шаблонная строка `Новый
// ${variantLabel}` → «Новый блюдо» для блюд. Ловим обратно регрессию.
describe('ScheduleFoodCreateModals — create-step header literal', () => {
  it('shows "Новое блюдо" when creating a dish', () => {
    render(<ScheduleFoodCreateModals scheduleId="2026-05-19" />);

    focusInput(SCHEDULE_FOOD_INPUT_IDS.SEARCH_INPUT);
    fireEvent.click(expanded().querySelector('[data-testid="pick-create-dish"]')!);
    focusInput(SCHEDULE_FOOD_INPUT_IDS.CREATE_INPUT);

    expect(expanded().textContent).toContain('Новое блюдо');
    expect(expanded().textContent).not.toContain('Новый блюдо');
  });

  it('shows "Новый продукт" when creating a product', () => {
    render(<ScheduleFoodCreateModals scheduleId="2026-05-19" />);

    focusInput(SCHEDULE_FOOD_INPUT_IDS.SEARCH_INPUT);
    fireEvent.click(expanded().querySelector('[data-testid="pick-create-product"]')!);
    focusInput(SCHEDULE_FOOD_INPUT_IDS.CREATE_INPUT);

    expect(expanded().textContent).toContain('Новый продукт');
  });
});
