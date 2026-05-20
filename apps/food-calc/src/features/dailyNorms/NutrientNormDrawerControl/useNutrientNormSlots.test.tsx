// @vitest-environment jsdom
// useNutrientNormSlots — переключение mode 'view' ↔ 'edit'/'create'.
// Главный сценарий: hasNorm=true, mode='view' → headerAction рендерит
// флажок-кнопку; click переводит mode в 'edit', bodyContent становится
// EditDailyNormModal-stub'ом. До 2026-05-21 эта ветка нигде не покрывалась.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, renderHook, fireEvent, act } from '@testing-library/react';
import { useNutrientNormSlots } from './useNutrientNormSlots';

const h = vi.hoisted(() => ({
  hasNorm: true,
}));

vi.mock('@/entities/daily-norm', () => ({
  useHasUserNorm: () => h.hasNorm,
  upsertUserNorm: vi.fn(),
}));
vi.mock('@/entities/daily-norm/model/default-norm', () => ({
  USER_NORM_ID: 'user-norm',
}));
vi.mock('@/shared/lib/dexie/schema', () => ({
  db: { daily_norms: { delete: vi.fn() } },
}));
vi.mock('@/features/dailyNorms/OpenDailyNorms/CreateDailyNormModal', () => ({
  default: () => <div data-testid="create-modal" />,
}));
vi.mock('@/features/dailyNorms/OpenDailyNorms/EditDailyNormModal', () => ({
  default: () => <div data-testid="edit-modal" />,
}));
vi.mock('@/shared/assets/icons/flag.svg?react', () => ({
  default: () => <svg data-testid="flag-icon" />,
}));
vi.mock('./NutrientNormDrawerControl.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `ns-${String(p)}` }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  h.hasNorm = true;
});

describe('useNutrientNormSlots — flagBtn click переключает mode', () => {
  it('hasNorm=true, mode=view → headerAction рендерит флажок-кнопку', () => {
    const { result } = renderHook(() => useNutrientNormSlots());
    const { container } = render(<>{result.current.headerAction}</>);
    expect(container.querySelector('[data-testid="flag-icon"]')).not.toBeNull();
    expect(result.current.bodyContent).toBeNull();
  });

  it('click flagBtn → mode=edit → bodyContent рендерит EditDailyNormModal', () => {
    const { result, rerender } = renderHook(() => useNutrientNormSlots());

    // Контракт перехода: click на flagBtn вызывает goToEdit → setMode('edit').
    const { container } = render(<>{result.current.headerAction}</>);
    const flagBtn = container.querySelector('button');
    expect(flagBtn).not.toBeNull();

    act(() => {
      fireEvent.click(flagBtn!);
    });
    rerender();

    // После клика body switches to edit modal, headerAction теряет флажок
    // (становится back-кнопкой). Тестируем оба инварианта вместе — это и есть
    // транзакция «один клик меняет два слота».
    const { container: bodyContainer } = render(<>{result.current.bodyContent}</>);
    expect(bodyContainer.querySelector('[data-testid="edit-modal"]')).not.toBeNull();

    const { container: headerContainer } = render(<>{result.current.headerAction}</>);
    expect(headerContainer.querySelector('[data-testid="flag-icon"]')).toBeNull();
    expect(headerContainer.querySelector('button')?.getAttribute('aria-label')).toBe(
      'Назад к нутриентам',
    );
  });

  it('hasNorm=false, mode=view → headerAction = null (нечего настраивать)', () => {
    h.hasNorm = false;
    const { result } = renderHook(() => useNutrientNormSlots());
    expect(result.current.headerAction).toBeNull();
  });
});
