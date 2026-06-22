import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { InlineWriteFoodReview } from './InlineWriteFoodReview';
import reviewStyles from './InlineWriteFoodReview.module.scss';
import type { UseWriteFoodFlowResult } from '../model/useWriteFoodFlow';

// Тяжёлые дочерние оверлеи предложки тянут Router/store-контекст (useNavigate и
// т.п.). Тест проверяет обвязку SheetCard, не их нутро — мокаем в null.
vi.mock('./FreeTextFoodReviewEditModals', () => ({
  FreeTextFoodReviewEditModals: () => null,
}));
vi.mock('./AddToListPopover', () => ({ AddToListPopover: () => null }));

// Минимальный mock flow — все функции no-op, состояние задаём через overrides.
function makeFlow(overrides: Partial<UseWriteFoodFlowResult> = {}): UseWriteFoodFlowResult {
  return {
    state: 'ready',
    parseResult: null,
    inputText: '',
    errorMessage: null,
    submit: vi.fn(),
    submitDishName: vi.fn(),
    retry: vi.fn(),
    cancel: vi.fn(),
    minimize: vi.fn(),
    setInputText: vi.fn(),
    resolved: [],
    ambiguous: [],
    unresolved: [],
    hideTime: false,
    totalToAdd: 0,
    isSubmitting: false,
    editingUid: null,
    editingStep: 'idle',
    editingRowView: null,
    toggleResolved: vi.fn(),
    toggleAmbiguous: vi.fn(),
    toggleUnresolved: vi.fn(),
    updateResolved: vi.fn(),
    updateAmbiguous: vi.fn(),
    updateUnresolved: vi.fn(),
    startEdit: vi.fn(),
    closeEdit: vi.fn(),
    setEditingStep: vi.fn(),
    handleEditChange: vi.fn(),
    commit: vi.fn().mockResolvedValue(true),
    ...overrides,
  } as UseWriteFoodFlowResult;
}

describe('InlineWriteFoodReview — SheetCard wiring', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  // Регрессия-страховка: предложка переведена на общий примитив SheetCard, а
  // auto-scroll/shake (WriteFoodInput, DishBuilderPage) находят узел по
  // [data-write-food-anchor] и вешают анимацию на класс reviewSheet. Если кто-то
  // сломает {...rest}-проброс в SheetCard — типы зелёные, но scroll/shake тихо
  // умрут. Этот тест ловит именно такую регрессию.
  it('loading: root carries data-write-food-anchor, data-state and the reviewSheet class', () => {
    const { container } = render(<InlineWriteFoodReview flow={makeFlow({ state: 'loading' })} />);
    const root = container.querySelector('[data-write-food-anchor]');
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute('data-state', 'loading');
    expect(root).toHaveClass(reviewStyles.reviewSheet);
    expect(screen.getByRole('heading', { name: 'Распознаём…' })).toBeInTheDocument();
  });

  it('ready: renders the header + actions slot and keeps the anchor', () => {
    const { container } = render(<InlineWriteFoodReview flow={makeFlow({ state: 'ready' })} />);
    const root = container.querySelector('[data-write-food-anchor]');
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute('data-state', 'ready');
    expect(screen.getByRole('heading', { name: 'Предложения' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Отменить' })).toBeInTheDocument();
    // totalToAdd === 0 → commit задизейблен.
    expect(screen.getByRole('button', { name: 'Добавить 0' })).toBeDisabled();
  });
});
