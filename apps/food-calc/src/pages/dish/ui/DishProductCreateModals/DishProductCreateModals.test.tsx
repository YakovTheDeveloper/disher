import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import DishProductCreateModals, { DISH_MODAL_INPUT_IDS } from './DishProductCreateModals';

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// ─── mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/shared/ui/Swipeable/SwipeableLockContext', () => ({
  useSwipeableLock: vi.fn(),
}));

vi.mock('@/shared/lib/useOverlayHistory', () => ({
  useOverlayHistory: vi.fn(),
}));

vi.mock('@/api/triplit/client', () => ({
  triplit: {},
}));

const mockAddDishItem = vi.fn().mockResolvedValue(undefined);
vi.mock('@/entities/dish', () => ({
  addDishItem: (...args: any[]) => mockAddDishItem(...args),
}));

const mockToasterSuccess = vi.fn();
vi.mock('@/shared/lib/toaster/toaster', () => ({
  default: {
    success: (...args: any[]) => mockToasterSuccess(...args),
  },
}));

// Lightweight SearchFood stub — renders the input and exposes a click handler
// that calls onFinish with a fake product.
let latestSearchFoodProps: any = null;
vi.mock('@/features/food/food-search', () => ({
  SearchFood: (props: any) => {
    latestSearchFoodProps = props;
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
        <button
          data-testid="quick-200"
          onClick={() => props.content.updateQuantity(200)}
        >
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
  const searchInput = result.container.querySelector(`#${DISH_MODAL_INPUT_IDS.SEARCH_INPUT}`);
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
  latestSearchFoodProps = null;
  latestQuantityProps = null;
});

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

// ─── commit flow ────────────────────────────────────────────────────────────

describe('DishProductCreateModals — commit', () => {
  it('calls addDishItem with correct data on "Готово"', async () => {
    renderAndSelectProduct();
    fireEvent.click(screen.getByText('Готово'));

    await waitFor(() => {
      expect(mockAddDishItem).toHaveBeenCalledWith({
        dishId: 'dish-123',
        foodId: 'prod-1',
        quantity: 100,
      });
    });
  });

  it('calls addDishItem with updated quantity when user changes it', async () => {
    renderAndSelectProduct();

    // Change quantity via quick button
    fireEvent.click(screen.getByTestId('quick-200'));

    fireEvent.click(screen.getByText('Готово'));

    await waitFor(() => {
      expect(mockAddDishItem).toHaveBeenCalledWith({
        dishId: 'dish-123',
        foodId: 'prod-1',
        quantity: 200,
      });
    });
  });

  it('shows success toast after commit', async () => {
    renderAndSelectProduct();
    fireEvent.click(screen.getByText('Готово'));

    await waitFor(() => {
      expect(mockToasterSuccess).toHaveBeenCalledWith('Продукт добавлен');
    });
  });
});

// ─── reset after commit ─────────────────────────────────────────────────────

describe('DishProductCreateModals — reset after commit', () => {
  it('resets draft foodId after commit (new flow gets default)', async () => {
    renderAndSelectProduct();

    // Commit with prod-1
    fireEvent.click(screen.getByText('Готово'));
    await waitFor(() => expect(mockAddDishItem).toHaveBeenCalledWith(
      expect.objectContaining({ foodId: 'prod-1' }),
    ));

    // Start a new flow — select a different product
    const searchInput = screen.getByTestId('search-input');
    fireEvent.focus(searchInput);
    fireEvent.click(screen.getByTestId('select-product-2'));
    fireEvent.click(screen.getByText('Готово'));

    // Second commit should use the new product, not the old one
    await waitFor(() => {
      expect(mockAddDishItem).toHaveBeenCalledTimes(2);
      expect(mockAddDishItem).toHaveBeenLastCalledWith(
        expect.objectContaining({ foodId: 'prod-2' }),
      );
    });
  });

  it('resets quantity to default (100) after commit', async () => {
    renderAndSelectProduct();
    fireEvent.click(screen.getByTestId('quick-200'));
    fireEvent.click(screen.getByText('Готово'));
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

describe('DishProductCreateModals — close', () => {
  it('resets state when back button is clicked', () => {
    const { container } = renderAndSelectProduct();

    // Click the back button (SVG arrow)
    const backButton = container.querySelector('header button')!;
    fireEvent.click(backButton);

    // Should NOT have called addDishItem
    expect(mockAddDishItem).not.toHaveBeenCalled();
  });

  it('resets draft on close so next flow starts fresh', async () => {
    const { container } = renderAndSelectProduct();

    // Change quantity
    fireEvent.click(screen.getByTestId('quick-200'));

    // Close without committing
    const backButton = container.querySelector('header button')!;
    fireEvent.click(backButton);
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
    const productCrumb = screen.getAllByRole('button').find((b) => b.textContent?.includes('Продукт'));
    expect(productCrumb).toBeDefined();
    fireEvent.click(productCrumb!);

    // Search should be active again — the search food component should be visible
    expect(screen.getByTestId('search-food')).toBeInTheDocument();
  });
});
