/* eslint-disable @typescript-eslint/no-explicit-any -- lightweight test-mock props */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import FoodEntryCreateModals from './FoodEntryCreateModals';
import { useFoodEntryFlow, type FoodEntryTarget } from './useFoodEntryFlow';
import { foodEntryInputIds } from './inputIds';
import { isJustAdded, takeJustAdded } from '@/shared/model/recentlyAddedStore';

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// ── mocks ─────────────────────────────────────────────────────────────────────
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
const mockAddDishItem = vi.fn().mockResolvedValue('new-dish-item-id');
vi.mock('@/entities/dish', () => ({
  addDishItem: (...args: any[]) => mockAddDishItem(...args),
  updateDishItem: vi.fn().mockResolvedValue(undefined),
  createDish: vi.fn().mockResolvedValue('new-dish-id'),
  useDishPortions: () => [],
}));
vi.mock('@/entities/product', () => ({
  useProductPortions: () => [],
  createProduct: vi.fn().mockResolvedValue('new-product-id'),
  setProductNutrients: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/shared/lib/safeMutate', () => ({
  safeMutate: async (fn: () => Promise<unknown>) => ({ ok: true, value: await fn() }),
}));
const mockToasterSuccess = vi.fn();
vi.mock('@/shared/lib/toaster/toaster', () => ({
  default: { success: (...a: any[]) => mockToasterSuccess(...a) },
}));

let hasHintsValue = false;
const setHasHints = (v: boolean) => {
  hasHintsValue = v;
};
const mockPersist = vi.fn().mockResolvedValue(undefined);
vi.mock('@/features/food/details-chips', () => ({
  useHasDetailsHints: () => hasHintsValue,
  DetailsStep: (props: any) => (
    <div data-testid="details-step">
      <textarea
        id={props.textareaId}
        data-testid="details-textarea"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </div>
  ),
  persistCustomTagsFromDetails: (...a: any[]) => mockPersist(...a),
}));

// Faithful SearchFood stub. Product cards are <label htmlFor={itemHtmlFor}> — like
// the real FoodActionCard. jsdom doesn't move focus through a label, so the stub
// focuses the target explicitly, reproducing what a real browser <label> does.
// The step transition is then driven by the host's onFocusCapture — NOT by a
// setStep inside onSelectFood (regression guard for the focus-delegation canon).
vi.mock('@/features/food/food-search', () => ({
  SearchFood: (props: any) => {
    const select = (variant: string, id: string, name: string) => {
      props.onSelectFood({ variant, id, name });
      if (props.itemHtmlFor) document.getElementById(props.itemHtmlFor)?.focus();
    };
    const pickCreate = (variant: string, name: string) => {
      props.onPickCreate?.(variant, name);
      if (props.createInputHtmlFor) document.getElementById(props.createInputHtmlFor)?.focus();
    };
    return (
      <div
        data-testid="search-food"
        data-mode={props.mode}
        data-exclude-supplements={String(!!props.excludeSupplements)}
      >
        <input id={props.inputId} data-testid="search-input" />
        <button data-testid="search-back" onClick={() => props.onBack?.()}>back</button>
        <label data-testid="select-product" htmlFor={props.itemHtmlFor} onClick={() => select('product', 'prod-1', 'Яблоко')}>Яблоко</label>
        <label data-testid="select-product-2" htmlFor={props.itemHtmlFor} onClick={() => select('product', 'prod-2', 'Молоко')}>Молоко</label>
        <button data-testid="pick-create-product" onClick={() => pickCreate('product', 'Морковь')}>+ Продукт</button>
        <button data-testid="pick-create-dish" onClick={() => pickCreate('dish', 'Борщ')}>+ Блюдо</button>
      </div>
    );
  },
}));

vi.mock('@/features/product/ProductQuantity', () => ({
  ProductQuantity: (props: any) => {
    return (
      <div data-testid="product-quantity">
        <input
          id={props.inputId}
          data-testid="quantity-input"
          type="number"
          value={props.content.quantity}
          onChange={(e) => props.content.updateQuantity(Number(e.target.value))}
        />
        <button data-testid="quick-200" onClick={() => props.content.updateQuantity(200)}>200</button>
      </div>
    );
  },
}));

// ── harness ───────────────────────────────────────────────────────────────────
const Harness = ({ target }: { target: FoodEntryTarget }) => {
  const flow = useFoodEntryFlow({ mode: 'create', target });
  return <FoodEntryCreateModals flow={flow} />;
};

const SCHEDULE: FoodEntryTarget = { kind: 'schedule', date: '2026-05-19' };
const DISH: FoodEntryTarget = { kind: 'dish', dishId: 'dish-123' };
const SCH_IDS = foodEntryInputIds('schedule').create;
const DISH_IDS = foodEntryInputIds('dish').create;

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
const clickActiveByText = (text: string) => {
  const btn = Array.from(expanded().querySelectorAll('button')).find(
    (b) => b.textContent?.trim() === text,
  );
  if (!btn) throw new Error(`No button "${text}" in active modal`);
  fireEvent.click(btn);
};

beforeEach(() => {
  vi.clearAllMocks();
  setHasHints(false);
  // Ящик — module-level Set: вычищаем id, которыми сыплют кейсы ниже.
  takeJustAdded('new-id');
  takeJustAdded('new-dish-item-id');
});

// ── schedule: time = «сейчас», no time step ──────────────────────────────────
describe('FoodEntryCreateModals (schedule) — commit stamps current time', () => {
  it('selecting a food then finishing commits with the current HH:MM', async () => {
    const { addScheduleFood } = await import('@/entities/schedule-food');
    render(<Harness target={SCHEDULE} />);

    focusInput(SCH_IDS.SEARCH_INPUT);
    fireEvent.click(screen.getByTestId('select-product'));
    focusInput(SCH_IDS.QUANTITY_INPUT);

    const before = new Date().toTimeString().slice(0, 5);
    clickActiveByText('Готово');
    const after = new Date().toTimeString().slice(0, 5);

    await waitFor(() => expect(addScheduleFood).toHaveBeenCalledTimes(1));
    const arg = vi.mocked(addScheduleFood).mock.calls[0][0] as { date: string; time: string };
    expect(arg.date).toBe('2026-05-19');
    expect([before, after]).toContain(arg.time);
  });

  it('помечает добавленную строку just-added ДО записи — фидбек «добавлено»', async () => {
    // Контракт: id ряда генерится ЗАРАНЕЕ, markAdded зовётся ДО записи и тот же id
    // передаётся в addScheduleFood. Иначе liveQuery смонтирует ряд на коммите раньше
    // флага, и появление проскочит (быстрый stagger вместо наплыва). Проверяем, что
    // ПЕРЕДАННЫЙ в мутацию id помечен в mailbox.
    const { addScheduleFood } = await import('@/entities/schedule-food');
    render(<Harness target={SCHEDULE} />);

    focusInput(SCH_IDS.SEARCH_INPUT);
    fireEvent.click(screen.getByTestId('select-product'));
    focusInput(SCH_IDS.QUANTITY_INPUT);
    clickActiveByText('Готово');

    await waitFor(() => expect(addScheduleFood).toHaveBeenCalledTimes(1));
    const id = (vi.mocked(addScheduleFood).mock.calls[0][0] as { id?: string }).id;
    expect(id).toBeTruthy();
    expect(isJustAdded(id!)).toBe(true);
  });

  it('never mounts a time input in create', () => {
    render(<Harness target={SCHEDULE} />);
    focusInput(SCH_IDS.SEARCH_INPUT);
    fireEvent.click(screen.getByTestId('select-product'));
    focusInput(SCH_IDS.QUANTITY_INPUT);
    expect(document.getElementById(SCH_IDS.TIME_INPUT)).toBeNull();
  });

  it('uses products-and-dishes search mode (whole dishes allowed in a day)', () => {
    render(<Harness target={SCHEDULE} />);
    focusInput(SCH_IDS.SEARCH_INPUT);
    expect(screen.getByTestId('search-food').getAttribute('data-mode')).toBe('products-and-dishes');
  });
});

// ── schedule: create-new variant label literals ──────────────────────────────
describe('FoodEntryCreateModals (schedule) — create-step header literal', () => {
  it('shows "Новое блюдо" (no БАД) when creating a dish', () => {
    render(<Harness target={SCHEDULE} />);
    focusInput(SCH_IDS.SEARCH_INPUT);
    fireEvent.click(screen.getByTestId('pick-create-dish'));
    focusInput(SCH_IDS.CREATE_INPUT);
    expect(expanded().textContent).toContain('Новое блюдо');
    expect(expanded().textContent).not.toContain('Новый блюдо');
    // БАД-блок только для продукта.
    expect(expanded().textContent).not.toContain('Таблетка');
  });

  it('shows "Новый продукт" when creating a product', () => {
    render(<Harness target={SCHEDULE} />);
    focusInput(SCH_IDS.SEARCH_INPUT);
    fireEvent.click(screen.getByTestId('pick-create-product'));
    focusInput(SCH_IDS.CREATE_INPUT);
    expect(expanded().textContent).toContain('Новый продукт');
  });
});

// ── dish: focus-delegation + commit ──────────────────────────────────────────
describe('FoodEntryCreateModals (dish) — select → quantity → commit', () => {
  it('advances to quantity via focus delegation after selecting a product', () => {
    render(<Harness target={DISH} />);
    focusInput(DISH_IDS.SEARCH_INPUT);
    fireEvent.click(screen.getByTestId('select-product'));
    expect(document.activeElement?.id).toBe(DISH_IDS.QUANTITY_INPUT);
    expect(expanded()).toContainElement(screen.getByTestId('product-quantity'));
  });

  it('commits addDishItem with the right args + success toast', async () => {
    render(<Harness target={DISH} />);
    focusInput(DISH_IDS.SEARCH_INPUT);
    fireEvent.click(screen.getByTestId('select-product'));
    focusInput(DISH_IDS.QUANTITY_INPUT);
    fireEvent.click(screen.getByTestId('quick-200'));
    clickActiveByText('Готово');

    await waitFor(() =>
      // id теперь генерит вызывающий (markAdded ДО записи) и передаёт в мутацию —
      // objectContaining терпит доп. поле id.
      expect(mockAddDishItem).toHaveBeenCalledWith(
        expect.objectContaining({
          dishId: 'dish-123',
          productId: 'prod-1',
          quantity: 200,
          details: '',
        }),
      ),
    );
    expect(mockToasterSuccess).toHaveBeenCalledWith('Продукт добавлен');
  });

  it('помечает добавленный ингредиент just-added ДО записи — паритет с расписанием', async () => {
    // Паритет с расписанием: id генерится заранее, markAdded ДО записи, тот же id
    // уходит в addDishItem. Проверяем, что ПЕРЕДАННЫЙ id помечен в mailbox.
    render(<Harness target={DISH} />);
    focusInput(DISH_IDS.SEARCH_INPUT);
    fireEvent.click(screen.getByTestId('select-product'));
    focusInput(DISH_IDS.QUANTITY_INPUT);
    fireEvent.click(screen.getByTestId('quick-200'));
    clickActiveByText('Готово');

    await waitFor(() => expect(mockAddDishItem).toHaveBeenCalledTimes(1));
    const id = (mockAddDishItem.mock.calls[0][0] as { id?: string }).id;
    expect(id).toBeTruthy();
    expect(isJustAdded(id!)).toBe(true);
  });

  it('uses products-only search mode (no dish-in-dish)', () => {
    render(<Harness target={DISH} />);
    focusInput(DISH_IDS.SEARCH_INPUT);
    expect(screen.getByTestId('search-food').getAttribute('data-mode')).toBe('products-only');
  });

  it('opt-in "+ деталь" commits details text', async () => {
    render(<Harness target={DISH} />);
    focusInput(DISH_IDS.SEARCH_INPUT);
    fireEvent.click(screen.getByTestId('select-product'));
    focusInput(DISH_IDS.QUANTITY_INPUT);
    expect(screen.getByText('+ деталь')).toBeInTheDocument();
    focusInput(DISH_IDS.DETAILS_INPUT);
    fireEvent.change(screen.getByTestId('details-textarea'), { target: { value: 'варёное' } });
    clickActiveByText('Готово');

    await waitFor(() =>
      expect(mockAddDishItem).toHaveBeenCalledWith(
        expect.objectContaining({ productId: 'prod-1', details: 'варёное' }),
      ),
    );
    expect(mockPersist).toHaveBeenCalledWith('prod-1', 'варёное');
  });
});

// ── БАД offered on schedule ONLY (dish nutrient calc считает в граммах →
//    serving-продукт дал бы неверную сумму, в блюде БАД запрещён 2026-06-20) ──
describe('FoodEntryCreateModals — supplement (БАД) offered on schedule only', () => {
  it('(dish) does NOT show the «Таблетка / лекарство / БАД» checkbox', () => {
    render(<Harness target={DISH} />);
    focusInput(DISH_IDS.SEARCH_INPUT);
    fireEvent.click(screen.getByTestId('pick-create-product'));
    focusInput(DISH_IDS.CREATE_INPUT);
    expect(expanded().textContent).toContain('Новый продукт');
    expect(expanded().textContent).not.toContain('Таблетка / лекарство / БАД');
  });

  it('(dish) passes excludeSupplements to SearchFood', () => {
    render(<Harness target={DISH} />);
    focusInput(DISH_IDS.SEARCH_INPUT);
    expect(
      screen.getByTestId('search-food').getAttribute('data-exclude-supplements'),
    ).toBe('true');
  });

  it('(schedule) shows the checkbox + creates product with isSupplement', async () => {
    const { createProduct } = await import('@/entities/product');
    render(<Harness target={SCHEDULE} />);
    focusInput(SCH_IDS.SEARCH_INPUT);
    fireEvent.click(screen.getByTestId('pick-create-product'));
    focusInput(SCH_IDS.CREATE_INPUT);
    expect(expanded().textContent).toContain('Таблетка / лекарство / БАД');
    // search на расписании НЕ исключает БАД
    expect(
      screen.getByTestId('search-food').getAttribute('data-exclude-supplements'),
    ).toBe('false');

    // Tick the supplement checkbox (click the real <input type=checkbox>).
    const checkbox = expanded().querySelector('input[type="checkbox"]');
    expect(checkbox).not.toBeNull();
    fireEvent.click(checkbox!);

    // Confirm: «Создать» renders as <label htmlFor={QUANTITY_INPUT}> (focus
    // delegation), NOT a <button> — click it by the label selector.
    const createBtn = expanded().querySelector(`label[for="${SCH_IDS.QUANTITY_INPUT}"]`);
    expect(createBtn).not.toBeNull();
    fireEvent.click(createBtn!);

    await waitFor(() =>
      expect(createProduct).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Морковь', isSupplement: true }),
      ),
    );
  });
});

// ── back-correctness (shared) ────────────────────────────────────────────────
describe('FoodEntryCreateModals — header back steps to previous step', () => {
  it('(dish) back from quantity returns to search, no commit', () => {
    render(<Harness target={DISH} />);
    focusInput(DISH_IDS.SEARCH_INPUT);
    fireEvent.click(screen.getByTestId('select-product'));
    focusInput(DISH_IDS.QUANTITY_INPUT);
    clickActiveBack();
    expect(mockAddDishItem).not.toHaveBeenCalled();
    expect(screen.getByTestId('search-food')).toBeInTheDocument();
  });
});
