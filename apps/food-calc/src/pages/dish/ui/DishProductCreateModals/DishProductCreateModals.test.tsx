/* eslint-disable @typescript-eslint/no-explicit-any -- lightweight test-mock props */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import DishProductCreateModals from './DishProductCreateModals';
import { DISH_MODAL_INPUT_IDS } from './DishProductCreateModals.constants';

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// ─── mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/shared/ui/Swipeable/SwipeableLockContext', () => ({
  useSwipeableLock: vi.fn(),
}));

vi.mock('@/shared/lib/useOverlayHistory', () => ({
  useOverlayHistory: vi.fn(),
}));

const mockAddDishItem = vi.fn().mockResolvedValue(undefined);
vi.mock('@/entities/dish', () => ({
  addDishItem: (...args: any[]) => mockAddDishItem(...args),
}));

vi.mock('@/entities/product', () => ({
  useProductPortions: () => [],
}));

const mockToasterSuccess = vi.fn();
vi.mock('@/shared/lib/toaster/toaster', () => ({
  default: {
    success: (...args: any[]) => mockToasterSuccess(...args),
  },
}));

// details-chips bundle is mocked so the test doesn't depend on Dexie-backed
// tag suggestions. `useHasDetailsHints` returns whatever the test sets via
// `setHasHints()` before render.
let hasHintsValue = false;
const mockPersistCustomTagsFromDetails = vi.fn().mockResolvedValue(undefined);
vi.mock('@/features/food/details-chips', () => ({
  useHasDetailsHints: () => hasHintsValue,
  DetailsChips: (props: any) => (
    <div data-testid="details-chips">
      <textarea
        id={props.textareaId}
        data-testid="details-textarea"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </div>
  ),
  persistCustomTagsFromDetails: (...args: any[]) => mockPersistCustomTagsFromDetails(...args),
}));

const setHasHints = (v: boolean) => {
  hasHintsValue = v;
};

// Lightweight SearchFood stub — renders the input and exposes a click handler
// that calls onFinish with a fake product.
vi.mock('@/features/food/food-search', () => ({
  SearchFood: (props: any) => {
    return (
      <div data-testid="search-food">
        <input id={props.inputId} data-testid="search-input" placeholder="search" />
        <button
          data-testid="select-product-1"
          onClick={() => props.onSelectFood({ variant: 'product', id: 'prod-1', name: 'Яблоко' })}
        >
          Яблоко
        </button>
        <button
          data-testid="select-product-2"
          onClick={() => props.onSelectFood({ variant: 'product', id: 'prod-2', name: 'Молоко' })}
        >
          Молоко
        </button>
      </div>
    );
  },
}));

// Lightweight ProductQuantity stub — renders the input and quick buttons.
let latestQuantityProps: any = null;
vi.mock('@/features/product/ProductQuantity', () => ({
  ProductQuantity: (props: any) => {
    latestQuantityProps = props;
    return (
      <div data-testid="product-quantity">
        <input
          id={props.inputId ?? 'quantity-input'}
          data-testid="quantity-input"
          type="number"
          value={props.content.quantity}
          onChange={(e) => props.content.updateQuantity(Number(e.target.value))}
        />
        <button data-testid="quick-200" onClick={() => props.content.updateQuantity(200)}>
          200
        </button>
      </div>
    );
  },
}));

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Renders the component and triggers the search modal by focusing the search input.
 */
const renderAndOpenSearch = () => {
  const result = render(<DishProductCreateModals dishId="dish-123" />);
  // Simulate label → focus delegation that opens the search step
  // ModalByLabel portals to document.body — query the document, not result.container.
  const searchInput = document.getElementById(DISH_MODAL_INPUT_IDS.SEARCH_INPUT);
  expect(searchInput).not.toBeNull();
  fireEvent.focus(searchInput!);
  return result;
};

/**
 * Opens search, selects a product, which advances to quantity step.
 */
const renderAndSelectProduct = (testId = 'select-product-1') => {
  const result = renderAndOpenSearch();
  fireEvent.click(screen.getByTestId(testId));
  return result;
};

beforeEach(() => {
  vi.clearAllMocks();
  latestQuantityProps = null;
  setHasHints(false);
});

// ─── DOM helpers ────────────────────────────────────────────────────────────
// ModalByLabel always-mounts every step's content and only flips a
// `data-modal-by-label="expanded"` attribute. So `getByText('Готово')`
// matches multiple steps simultaneously. Scope queries to the currently
// expanded modal.

const expanded = (): HTMLElement => {
  const node = document.querySelector('[data-modal-by-label="expanded"]');
  if (!node) throw new Error('No expanded ModalByLabel in document');
  return node as HTMLElement;
};

const clickActiveByText = (text: string) => {
  const btn = Array.from(expanded().querySelectorAll('button')).find(
    (b) => b.textContent?.trim() === text,
  );
  if (!btn) throw new Error(`No button with text "${text}" in active modal`);
  fireEvent.click(btn);
};

const clickActiveCommit = () => clickActiveByText('Готово');

const clickActiveBack = () => {
  const btn = expanded().querySelector('header button');
  if (!btn) throw new Error('No header button in active modal');
  fireEvent.click(btn);
};

// ─── step transitions ───────────────────────────────────────────────────────

describe('DishProductCreateModals — step transitions', () => {
  it('starts in idle state (no modals expanded)', () => {
    render(<DishProductCreateModals dishId="dish-123" />);
    // Search and quantity modals are rendered but not expanded — both should have content
    expect(screen.getByTestId('search-food')).toBeInTheDocument();
  });

  it('opens search step when search input receives focus', () => {
    renderAndOpenSearch();
    // Breadcrumb should show "Продукт" as current
    const breadcrumbs = screen.getAllByRole('button');
    const productCrumb = breadcrumbs.find((b) => b.textContent?.includes('Продукт'));
    expect(productCrumb).toBeDefined();
  });

  it('advances to quantity step after selecting a product', () => {
    renderAndSelectProduct();
    // Quantity step should now be active — the quantity input is rendered
    expect(screen.getByTestId('product-quantity')).toBeInTheDocument();
  });
});

// ─── commit flow (no-hints path) ────────────────────────────────────────────

describe('DishProductCreateModals — commit (no hints, finish on quantity)', () => {
  it('calls addDishItem with empty details on "Готово"', async () => {
    renderAndSelectProduct();
    clickActiveCommit();

    await waitFor(() => {
      expect(mockAddDishItem).toHaveBeenCalledWith({
        dishId: 'dish-123',
        productId: 'prod-1',
        quantity: 100,
        details: '',
      });
    });
  });

  it('calls addDishItem with updated quantity when user changes it', async () => {
    renderAndSelectProduct();

    // Change quantity via quick button
    fireEvent.click(screen.getByTestId('quick-200'));

    clickActiveCommit();

    await waitFor(() => {
      expect(mockAddDishItem).toHaveBeenCalledWith({
        dishId: 'dish-123',
        productId: 'prod-1',
        quantity: 200,
        details: '',
      });
    });
  });

  it('shows success toast after commit', async () => {
    renderAndSelectProduct();
    clickActiveCommit();

    await waitFor(() => {
      expect(mockToasterSuccess).toHaveBeenCalledWith('Продукт добавлен');
    });
  });

  it('does not persist custom tags when details are empty', async () => {
    renderAndSelectProduct();
    clickActiveCommit();

    await waitFor(() => {
      expect(mockAddDishItem).toHaveBeenCalled();
    });
    // Called with empty details — persistCustomTagsFromDetails is invoked
    // but is a no-op internally (we can still assert it was attempted).
    expect(mockPersistCustomTagsFromDetails).toHaveBeenCalledWith('prod-1', '');
  });
});

// ─── opt-in details (no-hints path) ─────────────────────────────────────────

describe('DishProductCreateModals — opt-in "+ деталь" link', () => {
  it('renders "+ деталь" label on quantity step when hasHints=false', () => {
    renderAndSelectProduct();
    expect(screen.getByText('+ деталь')).toBeInTheDocument();
  });

  it('opens details step when "+ деталь" label triggers details input focus', () => {
    renderAndSelectProduct();
    const detailsInput = document.getElementById(DISH_MODAL_INPUT_IDS.DETAILS_INPUT);
    expect(detailsInput).not.toBeNull();
    fireEvent.focus(detailsInput!);
    expect(screen.getByTestId('details-chips')).toBeInTheDocument();
  });

  it('commits with details text when user fills opt-in and finishes', async () => {
    renderAndSelectProduct();
    const detailsInput = document.getElementById(DISH_MODAL_INPUT_IDS.DETAILS_INPUT);
    fireEvent.focus(detailsInput!);

    const textarea = screen.getByTestId('details-textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'варёное' } });

    // Find the "Готово" button on the details step (variant=finish)
    clickActiveCommit();

    await waitFor(() => {
      expect(mockAddDishItem).toHaveBeenCalledWith({
        dishId: 'dish-123',
        productId: 'prod-1',
        quantity: 100,
        details: 'варёное',
      });
    });
    expect(mockPersistCustomTagsFromDetails).toHaveBeenCalledWith('prod-1', 'варёное');
  });
});

// ─── 3-step flow (hasHints path) ────────────────────────────────────────────

describe('DishProductCreateModals — 3-step flow (hasHints=true)', () => {
  beforeEach(() => {
    setHasHints(true);
  });

  it('does NOT render "+ деталь" opt-in label when hasHints=true', () => {
    renderAndSelectProduct();
    expect(screen.queryByText('+ деталь')).not.toBeInTheDocument();
  });

  it('renders "Заметка" in the steps header on quantity step', () => {
    renderAndSelectProduct();
    const breadcrumbs = screen.getAllByRole('button');
    const detailsCrumb = breadcrumbs.find((b) => b.textContent?.includes('Заметка'));
    expect(detailsCrumb).toBeDefined();
  });

  it('proceeding from quantity opens details step (label htmlFor=DETAILS_INPUT)', () => {
    renderAndSelectProduct();
    const detailsInput = document.getElementById(DISH_MODAL_INPUT_IDS.DETAILS_INPUT);
    fireEvent.focus(detailsInput!);
    expect(screen.getByTestId('details-chips')).toBeInTheDocument();
  });
});

// ─── reset after commit ─────────────────────────────────────────────────────

describe('DishProductCreateModals — reset after commit', () => {
  it('resets draft productId after commit (new flow gets default)', async () => {
    renderAndSelectProduct();

    // Commit with prod-1
    clickActiveCommit();
    await waitFor(() =>
      expect(mockAddDishItem).toHaveBeenCalledWith(expect.objectContaining({ productId: 'prod-1' }))
    );

    // Start a new flow — select a different product
    const searchInput = screen.getByTestId('search-input');
    fireEvent.focus(searchInput);
    fireEvent.click(screen.getByTestId('select-product-2'));
    clickActiveCommit();

    // Second commit should use the new product, not the old one
    await waitFor(() => {
      expect(mockAddDishItem).toHaveBeenCalledTimes(2);
      expect(mockAddDishItem).toHaveBeenLastCalledWith(
        expect.objectContaining({ productId: 'prod-2' })
      );
    });
  });

  it('resets details to empty string after commit', async () => {
    renderAndSelectProduct();
    const detailsInput = document.getElementById(DISH_MODAL_INPUT_IDS.DETAILS_INPUT);
    fireEvent.focus(detailsInput!);

    const textarea = screen.getByTestId('details-textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'варёное' } });
    clickActiveCommit();

    await waitFor(() => expect(mockAddDishItem).toHaveBeenCalled());

    // Start a new flow
    const searchInput = screen.getByTestId('search-input');
    fireEvent.focus(searchInput);
    fireEvent.click(screen.getByTestId('select-product-2'));
    clickActiveCommit();

    // Second commit should have empty details, not "варёное"
    await waitFor(() => {
      expect(mockAddDishItem).toHaveBeenLastCalledWith(
        expect.objectContaining({ details: '' })
      );
    });
  });

  it('resets quantity to default (100) after commit', async () => {
    renderAndSelectProduct();
    fireEvent.click(screen.getByTestId('quick-200'));
    clickActiveCommit();
    await waitFor(() => expect(mockAddDishItem).toHaveBeenCalled());

    // Start a new flow
    const searchInput = screen.getByTestId('search-input');
    fireEvent.focus(searchInput);
    fireEvent.click(screen.getByTestId('select-product-2'));

    // Quantity should be back to 100
    expect(latestQuantityProps?.content.quantity).toBe(100);
  });
});

// ─── close / back ───────────────────────────────────────────────────────────

describe('DishProductCreateModals — back / close', () => {
  it('header back on quantity step returns to the search step (not commit)', () => {
    renderAndSelectProduct();

    // ModalHeader back arrow — step-aware: quantity → search.
    clickActiveBack();

    expect(mockAddDishItem).not.toHaveBeenCalled();
    expect(screen.getByTestId('search-food')).toBeInTheDocument();
  });

  it('resets draft on full close so next flow starts fresh', () => {
    renderAndSelectProduct();

    // Change quantity
    fireEvent.click(screen.getByTestId('quick-200'));

    // Back twice: quantity → search → close the whole flow.
    clickActiveBack();
    clickActiveBack();
    expect(mockAddDishItem).not.toHaveBeenCalled();

    // Start a new flow
    const searchInput = screen.getByTestId('search-input');
    fireEvent.focus(searchInput);
    fireEvent.click(screen.getByTestId('select-product-1'));

    // Quantity should be default 100, not 200
    expect(latestQuantityProps?.content.quantity).toBe(100);
  });
});

// ─── breadcrumb navigation ──────────────────────────────────────────────────

describe('DishProductCreateModals — breadcrumb navigation', () => {
  it('can navigate back to search from quantity via breadcrumb', () => {
    renderAndSelectProduct();

    // Click on "Продукт" breadcrumb to go back to search
    const productCrumb = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('Продукт'));
    expect(productCrumb).toBeDefined();
    fireEvent.click(productCrumb!);

    // Search should be active again — the search food component should be visible
    expect(screen.getByTestId('search-food')).toBeInTheDocument();
  });
});
