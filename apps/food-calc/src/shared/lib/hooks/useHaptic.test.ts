import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHaptic } from './useHaptic';

// Поведенческое покрытие части 3 (haptic): единый хук должен бузжать на Android
// (navigator.vibrate есть) и быть ТИХИМ no-op на iOS/WebKit (vibrate никогда не
// реализован) — без бросков. iOS-приёмку «глазами/пальцем» на устройстве это не
// заменяет, но фиксирует контракт хука (feature-detect + pattern passthrough).

afterEach(() => {
  // navigator — общий синглтон jsdom: снимаем определённый нами vibrate, чтобы
  // no-op-кейс видел «API отсутствует» (как в WebKit).
  delete (navigator as Navigator & { vibrate?: unknown }).vibrate;
  vi.restoreAllMocks();
});

function stubVibrate() {
  const vibrate = vi.fn();
  Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
  return vibrate;
}

describe('useHaptic', () => {
  it('бузжит navigator.vibrate(10) по умолчанию, когда API есть (Android)', () => {
    const vibrate = stubVibrate();
    const { result } = renderHook(() => useHaptic());
    result.current();
    expect(vibrate).toHaveBeenCalledWith(10);
  });

  it('пробрасывает кастомный паттерн в navigator.vibrate', () => {
    const vibrate = stubVibrate();
    const { result } = renderHook(() => useHaptic());
    result.current([5, 10, 5]);
    expect(vibrate).toHaveBeenCalledWith([5, 10, 5]);
  });

  it('тихий no-op на iOS/WebKit (navigator.vibrate отсутствует) — не бросает', () => {
    // WebKit никогда не реализовал vibrate → undefined. Хук не должен упасть.
    expect((navigator as Navigator).vibrate).toBeUndefined();
    const { result } = renderHook(() => useHaptic());
    expect(() => result.current()).not.toThrow();
  });

  it('возвращает стабильную ссылку между рендерами (безопасно в deps)', () => {
    const { result, rerender } = renderHook(() => useHaptic());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
