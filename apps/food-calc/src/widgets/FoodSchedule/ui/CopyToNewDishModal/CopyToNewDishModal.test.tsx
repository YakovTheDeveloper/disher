import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import CopyToNewDishModal from './CopyToNewDishModal';

// ─── mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/shared/ui/Swipeable/SwipeableLockContext', () => ({
  useSwipeableLock: vi.fn(),
}));

vi.mock('@/api/triplit/client', () => ({
  triplit: {},
}));

const mockCreateDishWithItems = vi.fn().mockResolvedValue('new-dish-id');
vi.mock('@/entities/dish', () => ({
  createDishWithItems: (...args: any[]) => mockCreateDishWithItems(...args),
}));

const mockRemoveScheduleFoods = vi.fn().mockResolvedValue(undefined);
const mockAddScheduleFood = vi.fn().mockResolvedValue(undefined);
vi.mock('@/entities/schedule-food', () => ({
  removeScheduleFoods: (...args: any[]) => mockRemoveScheduleFoods(...args),
  addScheduleFood: (...args: any[]) => mockAddScheduleFood(...args),
  ScheduleFoodWithRelations: {},
}));

vi.mock('../ScheduleFoodCreationModals', () => ({
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

vi.mock('@/shared/ui/LabeledCheckbox', () => ({
  LabeledCheckbox: ({ label, ref: _ref }: any) => (
    <label><input type="checkbox" />{label}</label>
  ),
}));

vi.mock('@/shared/ui/TextBehind/TextBehind', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/shared/ui/atoms/input/TextInput', () => ({
  TextInput: (props: any) => <input {...props} />,
}));

// ─── helpers ────────────────────────────────────────────────────────────────

const makeItems = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `sf-${i + 1}`,
    food: { name: `Product ${i + 1}` },
    foodId: `food-${i + 1}`,
    quantity: 100 + i * 50,
    date: '2026-03-20',
    time: '12:00',
  }));

const defaultProps = () => ({
  isExpanded: true,
  items: makeItems(3) as any,
  onFinish: vi.fn(),
  onClose: vi.fn(),
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── step: name ─────────────────────────────────────────────────────────────

describe('CopyToNewDishModal — name step', () => {
  it('shows name input on initial render', () => {
    render(<CopyToNewDishModal {...defaultProps()} />);
    expect(screen.getByText('Как назовёте блюдо?')).toBeInTheDocument();
  });

  it('shows error when name is empty and "Далее" is clicked', () => {
    render(<CopyToNewDishModal {...defaultProps()} />);
    fireEvent.click(screen.getByText('Далее'));
    expect(mockToasterError).toHaveBeenCalledWith('Введите название блюда');
  });

  it('navigates to products step when name is provided', () => {
    render(<CopyToNewDishModal {...defaultProps()} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Борщ' } });
    fireEvent.click(screen.getByText('Далее'));

    expect(screen.getByText('Корректный список?')).toBeInTheDocument();
  });
});

// ─── step: products ─────────────────────────────────────────────────────────

describe('CopyToNewDishModal — products step', () => {
  const goToProducts = () => {
    render(<CopyToNewDishModal {...defaultProps()} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Борщ' } });
    fireEvent.click(screen.getByText('Далее'));
  };

  it('shows editable list with all products', () => {
    goToProducts();
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('Product 3')).toBeInTheDocument();
  });

  it('shows "Создать блюдо" button', () => {
    goToProducts();
    expect(screen.getByText('Создать блюдо')).toBeInTheDocument();
  });
});

// ─── confirm ────────────────────────────────────────────────────────────────

describe('CopyToNewDishModal — dish creation', () => {
  it('calls createDishWithItems with correct name and items', async () => {
    const props = defaultProps();
    render(<CopyToNewDishModal {...props} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Борщ' } });
    fireEvent.click(screen.getByText('Далее'));
    fireEvent.click(screen.getByText('Создать блюдо'));

    await waitFor(() => {
      expect(mockCreateDishWithItems).toHaveBeenCalledWith('Борщ', [
        { foodId: 'food-1', quantity: 100 },
        { foodId: 'food-2', quantity: 150 },
        { foodId: 'food-3', quantity: 200 },
      ]);
    });
  });

  it('shows success toast after creation', async () => {
    render(<CopyToNewDishModal {...defaultProps()} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Борщ' } });
    fireEvent.click(screen.getByText('Далее'));
    fireEvent.click(screen.getByText('Создать блюдо'));

    await waitFor(() => {
      expect(mockToasterSuccess).toHaveBeenCalledWith(
        expect.stringContaining('Борщ'),
        expect.objectContaining({ action: expect.any(Object) })
      );
    });
  });

  it('calls onFinish after successful creation', async () => {
    const props = defaultProps();
    render(<CopyToNewDishModal {...props} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Борщ' } });
    fireEvent.click(screen.getByText('Далее'));
    fireEvent.click(screen.getByText('Создать блюдо'));

    await waitFor(() => {
      expect(props.onFinish).toHaveBeenCalled();
    });
  });

  it('excludes deleted products from dish creation', async () => {
    render(<CopyToNewDishModal {...defaultProps()} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Борщ' } });
    fireEvent.click(screen.getByText('Далее'));

    // Delete second product
    const deleteButtons = screen.getAllByRole('button', { name: '×' });
    fireEvent.click(deleteButtons[1]);

    fireEvent.click(screen.getByText('Создать блюдо'));

    await waitFor(() => {
      expect(mockCreateDishWithItems).toHaveBeenCalledWith('Борщ', [
        { foodId: 'food-1', quantity: 100 },
        { foodId: 'food-3', quantity: 200 },
      ]);
    });
  });
});

// ─── close ──────────────────────────────────────────────────────────────────

describe('CopyToNewDishModal — close', () => {
  it('calls onClose when back button is clicked', () => {
    const props = defaultProps();
    render(<CopyToNewDishModal {...props} />);

    fireEvent.click(screen.getAllByText('←')[0]);
    expect(props.onClose).toHaveBeenCalled();
  });
});
