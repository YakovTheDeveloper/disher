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
  persistCustomTagsFromDetails: vi.fn().mockResolvedValue(undefined),
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
// порядку stepsForBar. Шаг времени убран из create-флоу (время = «сейчас»),
// поэтому первый шаг с StepHeader — quantity; его back ведёт на search (голый
// SearchFood со своим onBack=handleClose). Opt-in `details` (visited) →
// previous = quantity.

describe('ScheduleFoodCreateModals — header back steps to previous step', () => {
  it('back from the quantity step returns to search', () => {
    render(<ScheduleFoodCreateModals scheduleId="2026-05-19" />);

    focusInput(SCHEDULE_FOOD_INPUT_IDS.SEARCH_INPUT);
    fireEvent.click(expanded().querySelector('[data-testid="select-product"]')!);
    focusInput(SCHEDULE_FOOD_INPUT_IDS.QUANTITY_CREATE_INPUT);
    expect(expanded().querySelector('[data-testid="product-quantity"]')).not.toBeNull();

    clickActiveBack();

    expect(expanded().querySelector('[data-testid="search-food"]')).not.toBeNull();
  });

  it('back from the opt-in details step returns to quantity', () => {
    render(<ScheduleFoodCreateModals scheduleId="2026-05-19" />);

    focusInput(SCHEDULE_FOOD_INPUT_IDS.SEARCH_INPUT);
    fireEvent.click(expanded().querySelector('[data-testid="select-product"]')!);
    focusInput(SCHEDULE_FOOD_INPUT_IDS.QUANTITY_CREATE_INPUT);
    focusInput(SCHEDULE_FOOD_INPUT_IDS.DETAILS_INPUT);
    expect(expanded().querySelector('[data-testid="details-step"]')).not.toBeNull();

    clickActiveBack();

    expect(expanded().querySelector('[data-testid="product-quantity"]')).not.toBeNull();
  });
});

// ── time = «сейчас» ──────────────────────────────────────────────────────────
// Шаг времени убран: коммит штампует текущее время (HH:MM), а не спрашивает.
describe('ScheduleFoodCreateModals — commit stamps current time', () => {
  it('selecting a food then finishing commits with the current HH:MM', async () => {
    const { addScheduleFood } = await import('@/entities/schedule-food');

    render(<ScheduleFoodCreateModals scheduleId="2026-05-19" />);

    focusInput(SCHEDULE_FOOD_INPUT_IDS.SEARCH_INPUT);
    fireEvent.click(expanded().querySelector('[data-testid="select-product"]')!);
    focusInput(SCHEDULE_FOOD_INPUT_IDS.QUANTITY_CREATE_INPUT);

    // no-hints flow → quantity step's right button commits directly.
    const finish = expanded().querySelector('button[aria-label="Готово"]');
    expect(finish).not.toBeNull();

    // handleCommit штампует время ВНУТРИ клика; тест-now считается отдельно.
    // На стыке минуты (HH:59 → HH+1:00) одиночный снимок разошёлся бы с
    // заштампованным → флейк. Снимаем now до и после клика, принимаем обе границы.
    const before = new Date().toTimeString().slice(0, 5);
    fireEvent.click(finish!);
    const after = new Date().toTimeString().slice(0, 5);

    expect(addScheduleFood).toHaveBeenCalledTimes(1);
    const arg = vi.mocked(addScheduleFood).mock.calls[0][0] as { date: string; time: string };
    expect(arg.date).toBe('2026-05-19');
    expect([before, after]).toContain(arg.time);
  });
});

// ── create-new → commit ──────────────────────────────────────────────────────
// Самый рискованный путь: «+ создать продукт» → confirm (productId: null→UUID)
// → quantity → Готово. Гейт quantity = `(productId || dishId)`; на момент клика
// «Создать» productId ещё null, после — UUID. jsdom не воспроизводит браузерный
// тайминг label-делегации фокуса, поэтому шаг 'quantity' двигаем ручным focus —
// тест проверяет ЛОГИКУ шагов и коммит, не iOS-делегацию.
describe('ScheduleFoodCreateModals — create-new product flows to commit', () => {
  it('search → create product → quantity → commit with the new product id', async () => {
    const { addScheduleFood } = await import('@/entities/schedule-food');
    const { createProduct } = await import('@/entities/product');

    render(<ScheduleFoodCreateModals scheduleId="2026-05-19" />);

    focusInput(SCHEDULE_FOOD_INPUT_IDS.SEARCH_INPUT);
    fireEvent.click(expanded().querySelector('[data-testid="pick-create-product"]')!);
    focusInput(SCHEDULE_FOOD_INPUT_IDS.CREATE_INPUT);

    // confirm создаёт продукт (productId: null → UUID) и через
    // <label htmlFor={QUANTITY_INPUT}> делегирует фокус; step двигаем вручную.
    const createBtn = expanded().querySelector(
      `label[for="${SCHEDULE_FOOD_INPUT_IDS.QUANTITY_CREATE_INPUT}"]`,
    );
    expect(createBtn).not.toBeNull();
    fireEvent.click(createBtn!);
    expect(createProduct).toHaveBeenCalledTimes(1);

    focusInput(SCHEDULE_FOOD_INPUT_IDS.QUANTITY_CREATE_INPUT);
    expect(expanded().querySelector('[data-testid="product-quantity"]')).not.toBeNull();

    const finish = expanded().querySelector('button[aria-label="Готово"]');
    expect(finish).not.toBeNull();
    fireEvent.click(finish!);

    expect(addScheduleFood).toHaveBeenCalledTimes(1);
    const arg = vi.mocked(addScheduleFood).mock.calls[0][0] as {
      type: string;
      productId: string | null;
    };
    expect(arg.type).toBe('food');
    expect(arg.productId).toBeTruthy();
  });
});

// ── негатив: шага времени нет ────────────────────────────────────────────────
// Guard против случайного возврата шага времени в create-флоу: time-input не
// монтируется нигде, «Время» не появляется в Steps-bar.
describe('ScheduleFoodCreateModals — create flow has no time step', () => {
  it('never mounts the time input and omits «Время» from the step bar', () => {
    render(<ScheduleFoodCreateModals scheduleId="2026-05-19" />);

    focusInput(SCHEDULE_FOOD_INPUT_IDS.SEARCH_INPUT);
    fireEvent.click(expanded().querySelector('[data-testid="select-product"]')!);
    focusInput(SCHEDULE_FOOD_INPUT_IDS.QUANTITY_CREATE_INPUT);

    expect(document.getElementById(SCHEDULE_FOOD_INPUT_IDS.TIME_CREATE_INPUT)).toBeNull();
    expect(expanded().textContent).not.toContain('Время');
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
