import { useCallback, useRef } from 'react';

type LongPressHandlers = {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
  onPointerLeave: (e: React.PointerEvent) => void;
  onClickCapture: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
};

type Options = {
  /** Press duration before `onLongPress` fires. */
  delay?: number;
  /** Pointer drift (px) that cancels the press (treats it as a scroll/drag). */
  moveThreshold?: number;
  /** Fired on pointer-down when a press begins. Drives an optional press-visual
   *  (e.g. a `scale()` / tint affordance) without the consumer re-tracking the FSM. */
  onPressStart?: () => void;
  /** Fired when a press resolves — pointer up/cancel/leave, a move-cancel, or a
   *  completed long press. Pair with `onPressStart` to toggle the press-visual. */
  onPressEnd?: () => void;
};

/**
 * Adds a long-press gesture to an element while preserving its native click
 * (short tap + keyboard activation). Spread the returned handlers onto the
 * element and KEEP its own `onClick`: a completed long press fires
 * `onLongPress`, vibrates, and suppresses the click that would otherwise
 * follow the same pointer-up. A short tap or keyboard Enter/Space leaves the
 * click untouched.
 *
 * `onLongPress` is optional — pass `undefined` for elements that only want the
 * press-visual / tap (no long-press affordance): the hold timer is never armed,
 * so a sustained press is just a tap and the click is never suppressed.
 *
 * This is the canonical pointer pattern for the project (450ms threshold, 10px
 * move-cancel, pointer-capture, click suppression); `LongPressRow` consumes it.
 */
export function useLongPress(
  onLongPress?: () => void,
  { delay = 450, moveThreshold = 10, onPressStart, onPressEnd }: Options = {},
): LongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef({ x: 0, y: 0 });
  const pendingRef = useRef(false);
  const wasLongRef = useRef(false);
  const preventClickRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingRef.current = false;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button > 0) return; // ignore middle/right mouse buttons
      // Self-heal: a fresh press never inherits a stale click-suppression flag.
      // If a prior gesture's pointer-up was lost (e.g. setPointerCapture failed
      // and release landed on a freshly-mounted overlay), this clears the armed
      // flag so the next genuine tap / keyboard activation isn't swallowed.
      preventClickRef.current = false;
      try {
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      } catch {
        // capture is an optimisation (stops scroll stealing); not required
      }
      pendingRef.current = true;
      wasLongRef.current = false;
      startRef.current = { x: e.clientX, y: e.clientY };
      onPressStart?.();

      // No long-press affordance when the consumer didn't ask for one — the
      // press is then a plain tap (timer never armed, click never suppressed).
      if (!onLongPress) return;

      timerRef.current = setTimeout(() => {
        if (!pendingRef.current) return;
        wasLongRef.current = true;
        preventClickRef.current = true;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(10);
        }
        onPressEnd?.(); // press-visual ends the moment the long press succeeds
        onLongPress();
      }, delay);
    },
    [delay, onLongPress, onPressStart, onPressEnd],
  );

  // Release pointer capture, cancel the pending timer, end the press-visual, and
  // disarm the click-suppression shortly after. The native click (if any) fires
  // synchronously right after pointer-up — before this 50ms timer — so it still
  // sees the armed flag and gets suppressed; the next tap/keyboard activation
  // does not.
  const endPress = useCallback(
    (e: React.PointerEvent) => {
      try {
        (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
      clearTimer();
      onPressEnd?.();
      setTimeout(() => {
        preventClickRef.current = false;
      }, 50);
    },
    [clearTimer, onPressEnd],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pendingRef.current) return;
      const shift = Math.max(
        Math.abs(e.clientX - startRef.current.x),
        Math.abs(e.clientY - startRef.current.y),
      );
      if (shift > moveThreshold) endPress(e);
    },
    [endPress, moveThreshold],
  );

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (preventClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    if (wasLongRef.current) e.preventDefault();
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: endPress,
    onPointerCancel: endPress,
    onPointerLeave: endPress,
    onClickCapture,
    onContextMenu,
  };
}
