import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { usePortionFlow } from './usePortionFlow';

// Флоу зовёт оба контекст/history-хука; мокаем, как канонные create-модалки,
// чтобы юнит-тест не зависел от Swipeable-контекста и overlay-history стека.
vi.mock('@/shared/ui/Swipeable/SwipeableLockContext', () => ({
  useSwipeableLock: vi.fn(),
}));
vi.mock('@/shared/lib/useOverlayHistory', () => ({
  useOverlayHistory: vi.fn(),
}));

describe('usePortionFlow', () => {
  it('isDuplicate блокирует существующее имя без учёта регистра/пробелов', () => {
    const { result } = renderHook(() =>
      usePortionFlow({ existingLabels: ['Миска'], unit: 'г', onCreate: vi.fn() }),
    );
    expect(result.current.isDuplicate('миска')).toBe(true);
    expect(result.current.isDuplicate('  МИСКА  ')).toBe(true);
    expect(result.current.isDuplicate('тарелка')).toBe(false);
    expect(result.current.isDuplicate('')).toBe(false);
  });

  it('handleConfirmName тримит и пишет label в draft (без смены шага)', () => {
    const { result } = renderHook(() =>
      usePortionFlow({ existingLabels: [], unit: 'г', onCreate: vi.fn() }),
    );
    act(() => result.current.handleConfirmName('  утренняя  '));
    expect(result.current.draft.label).toBe('утренняя');
    // setStep НЕ зовётся в handleConfirmName — переход делает focus-делегация.
    expect(result.current.step).toBe('idle');
  });

  it('handleCommit отдаёт onCreate {label, grams} и сбрасывает draft', async () => {
    const onCreate = vi.fn();
    const { result } = renderHook(() =>
      usePortionFlow({ existingLabels: [], unit: 'г', onCreate }),
    );
    act(() => result.current.handleConfirmName('утренняя'));
    act(() => result.current.updateGrams(250));
    await act(async () => {
      await result.current.handleCommit();
    });
    expect(onCreate).toHaveBeenCalledWith({ label: 'утренняя', grams: 250 });
    expect(result.current.draft).toEqual({ label: '', grams: 0 });
    expect(result.current.step).toBe('idle');
  });

  it('handleCommit с пустым label — no-op (onCreate не зовётся)', async () => {
    const onCreate = vi.fn();
    const { result } = renderHook(() =>
      usePortionFlow({ existingLabels: [], unit: 'г', onCreate }),
    );
    await act(async () => {
      await result.current.handleCommit();
    });
    expect(onCreate).not.toHaveBeenCalled();
  });
});
