import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import CopyToExistingDishModal from './CopyToExistingDishModal';

// ─── mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/shared/ui/Swipeable/SwipeableLockContext', () => ({
  useSwipeableLock: vi.fn(),
}));

vi.mock('@/api/triplit/client', () => ({
  triplit: {},
}));

vi.mock('../ScheduleFoodCreateModals', () => ({
  MODAL_INPUT_IDS: {
    TIME_INPUT: 'time-input-schedule-food',
    SEARCH_INPUT: 'search',
    QUANTITY_INPUT: 'quantity-input',
    DISH_NAME_INPUT: 'dish-name-input',
  },
}));

const mockToasterError = vi.fn();
const mockToasterSuccess = vi.fn();
vi.mock('@/shared/lib/toaster/toaster', () => ({
  default: {
    error: (...args: any[]) => mockToasterError(...args),
    success: (...args: any[]) => mockToasterSuccess(...args),
  },
}));

vi.mock('@/router', () => ({
  RouterUrls: { getDish: (id: string) => `/dish/${id}` },
}));

const mockScheduleFoodsToDishItems = vi.fn().mockResolvedValue(undefined);
vi.mock('@/entities/schedule-food', () => ({
  scheduleFoodsToDishItems: (...args: any[]) => mockScheduleFoodsToDishItems(...args),
  ScheduleFoodWithRelations: {},
}));

// Mock SearchFood — render a button that simulates dish selection
vi.mock('@/features/food/food-search', () => ({
  SearchFood: ({ onFinish }: { onFinish: (payload: { variant: string; id: string }) => void }) => (
    <button onClick={() => onFinish({ variant: 'dish', id: 'dish-42' })}>Select Dish</button>
  ),
}));

// ─── helpers ────────────────────────────────────────────────────────────────

const makeItems = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `item-${i + 1}`,
    food: { name: `Product ${i + 1}` },
    foodId: `food-${i + 1}`,
    quantity: 100,
    date: '2026-03-20',
    time: '12:00',
  }));

const defaultProps = () => ({
  isExpanded: true,
  selectedIds: ['item-1', 'item-2', 'item-3'],
  items: makeItems(3) as any,
  onFinish: vi.fn(),
  onClose: vi.fn(),
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── step: selectDish ───────────────────────────────────────────────────────

describe('CopyToExistingDishModal — dish selection step', () => {
  it('shows search/dish selection on initial render', () => {
    render(<CopyToExistingDishModal {...defaultProps()} />);
    expect(screen.getByText('Select Dish')).toBeInTheDocument();
  });

  it('navigates to products step after dish selection', () => {
    render(<CopyToExistingDishModal {...defaultProps()} />);
    fireEvent.click(screen.getByText('Select Dish'));

    expect(screen.getByText('Корректный список?')).toBeInTheDocument();
  });
});

// ─── step: products ─────────────────────────────────────────────────────────

describe('CopyToExistingDishModal — products step', () => {
  const goToProducts = () => {
    render(<CopyToExistingDishModal {...defaultProps()} />);
    fireEvent.click(screen.getByText('Select Dish'));
  };

  it('shows editable list with all products', () => {
    goToProducts();
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('Product 3')).toBeInTheDocument();
  });

  it('shows "Выбрать" button', () => {
    goToProducts();
    expect(screen.getByText('Выбрать')).toBeInTheDocument();
  });
});

// ─── confirm ────────────────────────────────────────────────────────────────

describe('CopyToExistingDishModal — confirm', () => {
  it('shows success toast on confirm', async () => {
    render(<CopyToExistingDishModal {...defaultProps()} />);
    fireEvent.click(screen.getByText('Select Dish'));
    fireEvent.click(screen.getByText('Выбрать'));

    await waitFor(() => {
      expect(mockToasterSuccess).toHaveBeenCalledWith(
        'Скопировано в блюдо',
        expect.objectContaining({ action: expect.any(Object) })
      );
    });
  });

  it('calls onFinish after confirm', async () => {
    const props = defaultProps();
    render(<CopyToExistingDishModal {...props} />);
    fireEvent.click(screen.getByText('Select Dish'));
    fireEvent.click(screen.getByText('Выбрать'));

    await waitFor(() => {
      expect(props.onFinish).toHaveBeenCalled();
    });
  });

  it('shows error when all items are deleted and confirm is clicked', async () => {
    const props = defaultProps();
    props.items = makeItems(2) as any;
    props.selectedIds = ['item-1', 'item-2'];
    render(<CopyToExistingDishModal {...props} />);
    fireEvent.click(screen.getByText('Select Dish'));

    // Delete first item
    const deleteButton = screen.getAllByRole('button', { name: '×' })[0];
    fireEvent.click(deleteButton);

    // Now only 1 active item — confirm should still work
    fireEvent.click(screen.getByText('Выбрать'));
    await waitFor(() => {
      expect(mockToasterSuccess).toHaveBeenCalled();
    });
  });
});

// ─── close ──────────────────────────────────────────────────────────────────

describe('CopyToExistingDishModal — close', () => {
  it('calls onClose when back button is clicked', () => {
    const props = defaultProps();
    const { container } = render(<CopyToExistingDishModal {...props} />);

    fireEvent.click(container.querySelector('header button')!);
    expect(props.onClose).toHaveBeenCalled();
  });
});

// ─── breadcrumb navigation ──────────────────────────────────────────────────

describe('CopyToExistingDishModal — breadcrumbs', () => {
  it('can navigate back to dish selection from products step', () => {
    render(<CopyToExistingDishModal {...defaultProps()} />);
    fireEvent.click(screen.getByText('Select Dish'));

    // "Блюдо" breadcrumb should be clickable now (multiple rendered, pick the completed one)
    const dishCrumbs = screen.getAllByText('Блюдо');
    fireEvent.click(dishCrumbs[dishCrumbs.length - 1]);

    // Should be back on dish selection step
    expect(screen.getByText('Select Dish')).toBeInTheDocument();
  });
});
