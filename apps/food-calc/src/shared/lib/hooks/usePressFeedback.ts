import { useCallback, useEffect, useRef, useState } from 'react';

// Минимальное время, которое инверсия держится после pointerup. Очень быстрый
// тап (стилус / синтетика) иначе мигнул бы на <1 кадр и был бы незаметен.
const MIN_HOLD_MS = 120;

/**
 * Гарантированно-видимый press-отклик для тап-таргетов, которые на тапе тут же
 * уводят на другой экран / размонтируются.
 *
 * Почему не `:active`: iOS WebKit не применяет `:active` к не-`<button>`
 * элементам без touch-листенера, и даже когда применяет — стиль не успевает
 * отрисоваться, если клик синхронно меняет шаг и размонтирует элемент (ровно
 * случай SearchFood → следующий шаг). Здесь инверсия включается на `pointerdown`
 * (рисуется в фазе «палец прижат», ДО `click` → перехода) и держится минимум
 * MIN_HOLD_MS, поэтому даже мгновенный тап даёт видимую вспышку.
 *
 * Использование:
 *   const { pressed, pressProps } = usePressFeedback();
 *   <li data-pressed={pressed || undefined} {...pressProps}>…</li>
 * CSS: `&[data-pressed] { …сильная инверсия… }`.
 *
 * Для нескольких независимых таргетов (две кнопки рядом) — вызывать хук по разу
 * на каждый, иначе один `pressed` подсветит оба.
 */
export function usePressFeedback() {
  const [pressed, setPressed] = useState(false);
  const downAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current != null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const press = useCallback(() => {
    clearTimer();
    downAt.current = performance.now();
    setPressed(true);
  }, [clearTimer]);

  // Отпускание настоящего тапа: держим инверсию минимум MIN_HOLD_MS, чтобы
  // мгновенный тап успел мигнуть видимо.
  const release = useCallback(() => {
    const remaining = MIN_HOLD_MS - (performance.now() - downAt.current);
    if (remaining <= 0) {
      setPressed(false);
      return;
    }
    clearTimer();
    timer.current = setTimeout(() => {
      setPressed(false);
      timer.current = null;
    }, remaining);
  }, [clearTimer]);

  // Отмена (жест превратился в скролл → pointercancel; палец ушёл с таргета →
  // pointerleave) — это НЕ тап, гасим мгновенно без удержания, иначе карточка
  // мигнёт инверсией на старте скролла списка.
  const cancel = useCallback(() => {
    clearTimer();
    setPressed(false);
  }, [clearTimer]);

  // Размонтаж в середине press'а (тап увёл на другой экран) — гасим висящий
  // таймер, чтобы не было setState-after-unmount.
  useEffect(() => clearTimer, [clearTimer]);

  return {
    pressed,
    pressProps: {
      onPointerDown: press,
      onPointerUp: release,
      onPointerCancel: cancel,
      onPointerLeave: cancel,
    },
  };
}
