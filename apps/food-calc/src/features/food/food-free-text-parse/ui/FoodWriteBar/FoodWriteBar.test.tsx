import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { FoodWriteBar } from './FoodWriteBar';
import type { UseWriteFoodFlowResult } from '../../model/useWriteFoodFlow';

// Панель предложки тянет drawer-store / createProduct / router — тут проверяем
// только обвязку самого бара (ready-заголовок ↔ инпут), не нутро панели. Мокаем
// в null (как InlineWriteFoodReview.test мокает свои тяжёлые оверлеи).
vi.mock('../InlineWriteFoodReview', () => ({ InlineWriteFoodReview: () => null }));

// Минимальный mock flow — состояние задаём через override, функции no-op.
function makeFlow(overrides: Partial<UseWriteFoodFlowResult> = {}): UseWriteFoodFlowResult {
  return {
    state: 'idle',
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

function renderBar(flow: UseWriteFoodFlowResult) {
  return render(
    <FoodWriteBar flow={flow} inputId="test-food-input" searchHtmlFor="test-search-input" />,
  );
}

describe('FoodWriteBar — ready-заголовок ↔ инпут', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  // Дыра, которую этот тест сторожит: на `ready` инпут подменяется заголовком
  // «Предложения» через `fieldOverride` (2026-07-02). Если оборвать проводку
  // `fieldOverride={panelOpen ? ...}` — заголовок тихо исчезнет и с бара, и с
  // листка предложки (там его тоже больше нет), а типы останутся зелёными.
  it('ready: заголовок «Предложения» рендерится в баре', () => {
    renderBar(makeFlow({ state: 'ready' }));
    expect(screen.getByRole('heading', { name: 'Предложения' })).toBeInTheDocument();
  });

  // Обратная сторона: подмена условна (`panelOpen`). В покое бар — обычный
  // free-text-инпут, заголовка быть не должно.
  it('idle: заголовка «Предложения» нет (обычный инпут-бар)', () => {
    renderBar(makeFlow({ state: 'idle' }));
    expect(screen.queryByRole('heading', { name: 'Предложения' })).toBeNull();
  });
});

// Ядро унификации 2026-07-02: send-монета content-driven (`send.visible = hasText`)
// — появляется только при тексте, без «постоянной» серой disabled-монеты и без
// снятого пропа `autoHideSend`. Тип-чек это не ловит; без теста регресс на
// «монета всегда висит» пройдёт молча.
describe('FoodWriteBar — send-монета content-driven', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('пустое поле → send-монеты нет', () => {
    renderBar(makeFlow({ state: 'idle', inputText: '' }));
    expect(screen.queryByRole('button', { name: 'Отправить' })).toBeNull();
  });

  it('есть текст → send-монета появляется', () => {
    renderBar(makeFlow({ state: 'idle', inputText: 'овсянка' }));
    expect(screen.getByRole('button', { name: 'Отправить' })).toBeInTheDocument();
  });
});
