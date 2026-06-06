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
};

/**
 * Adds a long-press gesture to an element while preserving its native click
 * (short tap + keyboard activation). Spread the returned handlers onto the
 * element and KEEP its own `onClick`: a completed long press fires
 * `onLongPress`, vibrates, and suppresses the click that would otherwise
 * follow the same pointer-up. A short tap or keyboard Enter/Space leaves the
 * click untouched.
 *
 * Mirrors the canonical pointer pattern from `LongPressRow` (450ms threshold,
 * 10px move-cancel, pointer-capture, click suppression) so behaviour is
 * consistent with the per-item action drawer.
 */
export function useLongPress(
  onLongPress: () => void,
  { delay = 450, moveThreshold = 10 }: Options = {},
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
      timerRef.current = setTimeout(() => {
        if (!pendingRef.current) return;
        wasLongRef.current = true;
        preventClickRef.current = true;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(10);
        }
        onLongPress();
      }, delay);
    },
    [delay, onLongPress],
  );

  // Release pointer capture, cancel the pending timer, and disarm the
  // click-suppression shortly after. The native click (if any) fires
  // synchronously right after pointer-up — before this 50ms timer — so it
  // still sees the armed flag and gets suppressed; the next tap/keyboard
  // activation does not.
  const endPress = useCallback(
    (e: React.PointerEvent) => {
      try {
        (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
      clearTimer();
      setTimeout(() => {
        preventClickRef.current = false;
      }, 50);
    },
    [clearTimer],
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
