import { useCallback, useEffect, useRef } from 'react';

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
  // The 50ms click-disarm timer (see endPress) — held in a ref so the unmount
  // cleanup can cancel it too; otherwise it fires on a gone component.
  const disarmRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef({ x: 0, y: 0 });
  const pendingRef = useRef(false);
  const wasLongRef = useRef(false);
  const preventClickRef = useRef(false);
  // True between onPressStart and onPressEnd — makes the press-visual end exactly
  // once (a completed long press ends it in the timer; pointer-up must not end it
  // a second time, or onPressStart/onPressEnd stop being balanced for consumers
  // that count them).
  const pressedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingRef.current = false;
  }, []);

  // End the press-visual at most once per press (idempotent onPressEnd).
  const endVisual = useCallback(() => {
    if (!pressedRef.current) return;
    pressedRef.current = false;
    onPressEnd?.();
  }, [onPressEnd]);

  // Cancel both pending timers when the row unmounts mid-press (long-press opening
  // a drawer that unmounts the list, navigation, list re-render) — otherwise the
  // hold timer fires onLongPress / the disarm timer touches refs on a gone node.
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (disarmRef.current) clearTimeout(disarmRef.current);
    },
    [],
  );

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
      pressedRef.current = true;
      startRef.current = { x: e.clientX, y: e.clientY };
      onPressStart?.();

      // No long-press affordance when the consumer didn't ask for one — the
      // press is then a plain tap (timer never armed, click never suppressed).
      if (!onLongPress) return;

      timerRef.current = setTimeout(() => {
        if (!pendingRef.current) return;
        // Disarm the pending FSM so a later pointer-up's endPress doesn't run the
        // release path a second time (clearTimer is a no-op, endVisual is idempotent).
        pendingRef.current = false;
        wasLongRef.current = true;
        preventClickRef.current = true;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(10);
        }
        endVisual(); // press-visual ends the moment the long press succeeds
        onLongPress();
      }, delay);
    },
    [delay, onLongPress, onPressStart, endVisual],
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
      endVisual();
      if (disarmRef.current) clearTimeout(disarmRef.current);
      disarmRef.current = setTimeout(() => {
        preventClickRef.current = false;
        disarmRef.current = null;
      }, 50);
    },
    [clearTimer, endVisual],
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
