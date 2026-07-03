import { useCallback } from 'react';

/**
 * Единый хук тактильного отклика (haptic) — тонкая обёртка над
 * `navigator.vibrate` с feature-detect.
 *
 * Progressive enhancement: вибро ВТОРИЧНО (визуальный фидбек первичен). Если
 * платформа не поддерживает vibrate — тихий no-op, ничего не ломается.
 *
 * iOS/WebKit **никогда** не реализовал `navigator.vibrate` → на всех браузерах
 * iOS это тихий no-op. Вибро есть только на Android — это ОК и ожидаемо. Хак
 * `<input switch>` Apple прикрыл в iOS 26.5; библиотеку `ios-haptics` НЕ
 * подключаем (уходящая лазейка ради уже закрытой железки).
 *
 * Канон: единственная точка входа для короткого buzz — long-press (useLongPress)
 * и успешное создание сущности (write-flow) зовут именно этот хук.
 */
export function useHaptic(): (pattern?: number | number[]) => void {
  return useCallback((pattern: number | number[] = 10) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  }, []);
}
