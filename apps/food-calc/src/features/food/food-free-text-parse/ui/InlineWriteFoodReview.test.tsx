import { render, screen, cleanup, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { InlineWriteFoodReview } from './InlineWriteFoodReview';
import reviewStyles from './InlineWriteFoodReview.module.scss';
import type { UseWriteFoodFlowResult, UnresolvedRow } from '../model/useWriteFoodFlow';

// Тяжёлые дочерние оверлеи предложки тянут Router/store-контекст (useNavigate и
// т.п.). Тест проверяет обвязку + раскладку секций, не их нутро — мокаем в null.
vi.mock('./ProposalEditModals', () => ({ ProposalEditModals: () => null }));
vi.mock('./AddToListPopover', () => ({ AddToListPopover: () => null }));

// Минимальный mock flow — все функции no-op, состояние задаём через overrides.
function makeFlow(overrides: Partial<UseWriteFoodFlowResult> = {}): UseWriteFoodFlowResult {
  return {
    targetKind: 'schedule',
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
    toggleResolved: vi.fn(),
    toggleAmbiguous: vi.fn(),
    toggleUnresolved: vi.fn(),
    updateResolved: vi.fn(),
    updateAmbiguous: vi.fn(),
    updateUnresolved: vi.fn(),
    updateRow: vi.fn(),
    commit: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

// Ряд «не распознано» — минимальный, но валидный по типу. `manual`/`choice`
// задаём в тестах: их наличие и есть критерий переезда в основную секцию.
function unresolvedRow(uid: string, originalName: string, over: Partial<UnresolvedRow> = {}): UnresolvedRow {
  return {
    uid,
    originalName,
    details: '',
    quantity: 100,
    time: '08:00',
    enabled: true,
    choice: null,
    manual: null,
    foodEdited: false,
    timeEdited: false,
    qtyEdited: false,
    ...over,
  };
}

describe('InlineWriteFoodReview — SheetCard wiring', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  // Регрессия-страховка: предложка переведена на общий примитив SheetCard;
  // `data-state` + класс reviewSheet маркируют root (мёртвый доскролл/якорь к
  // предложке выпилены 2026-07-02 — она теперь в доке бара). Если кто-то сломает
  // {...rest}-проброс в SheetCard — типы зелёные, но маркеры тихо пропадут. Этот
  // тест ловит именно такую регрессию.
  it('loading: root carries data-state and the reviewSheet class', () => {
    const { container } = render(<InlineWriteFoodReview flow={makeFlow({ state: 'loading' })} />);
    const root = container.querySelector('[data-state="loading"]');
    expect(root).not.toBeNull();
    expect(root).toHaveClass(reviewStyles.reviewSheet);
    expect(screen.getByRole('heading', { name: 'Распознаём…' })).toBeInTheDocument();
  });

  it('ready: renders the actions slot; header moved to the bar', () => {
    const { container } = render(<InlineWriteFoodReview flow={makeFlow({ state: 'ready' })} />);
    const root = container.querySelector('[data-state="ready"]');
    expect(root).not.toBeNull();
    // Заголовок «Предложения» переехал в бар (FoodWriteBar.readyHeader, 2026-07-02)
    // — на листке предложки его больше нет (иначе задваивался бы над панелью).
    expect(screen.queryByRole('heading', { name: 'Предложения' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Отменить' })).toBeInTheDocument();
    // totalToAdd === 0 → commit задизейблен.
    expect(screen.getByRole('button', { name: 'Подтвердить' })).toBeDisabled();
  });
});

describe('InlineWriteFoodReview — переезд подобранной строки в основную секцию', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  // Ряд из «Не распознано», которому подобрана еда (choice ИЛИ auto-localMatch
  // `manual`), рендерится в ОСНОВНОЙ секции, а не под «Не распознано». Счётчик
  // секции = только pending. См. memory predlozhka-promote-picked.
  it('подобранный ряд уходит из «Не распознано»; счётчик секции = только pending', () => {
    render(
      <InlineWriteFoodReview
        flow={makeFlow({
          unresolved: [
            unresolvedRow('u1', 'цыц'), // pending — без подбора
            unresolvedRow('u2', 'малоко', {
              manual: { id: 'p1', name: 'Молоко', score: 1 },
            }),
          ],
        })}
      />
    );

    // Заголовок секции существует и несёт счётчик "1" (только pending), не "2".
    const heading = screen.getByRole('heading', { name: /Не распознано/ });
    expect(heading).toHaveTextContent('1');

    // Подобранная еда отрисована и НЕ внутри секции «Не распознано».
    const section = heading.closest('section') as HTMLElement;
    expect(within(section).queryByText('Молоко')).toBeNull();
    // Pending-строка (fallback-имя = originalName) осталась в секции.
    expect(within(section).getByText('цыц')).toBeInTheDocument();
    // А подобранная — где-то в предложке, но снаружи этой секции.
    expect(screen.getByText('Молоко')).toBeInTheDocument();
  });

  it('все unresolved подобраны → секция «Не распознано» не рендерится', () => {
    render(
      <InlineWriteFoodReview
        flow={makeFlow({
          unresolved: [
            unresolvedRow('u1', 'малоко', { manual: { id: 'p1', name: 'Молоко', score: 1 } }),
          ],
        })}
      />
    );

    expect(screen.queryByRole('heading', { name: /Не распознано/ })).toBeNull();
    expect(screen.getByText('Молоко')).toBeInTheDocument();
  });
});
