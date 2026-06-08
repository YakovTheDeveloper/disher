import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './HoldButton.module.scss';

type Props = {
  /** How long the press must be sustained before `onComplete` fires (ms). */
  holdMs: number;
  onComplete: () => void;
  disabled?: boolean;
  /** While true the button is locked and shows `busyLabel` (action in flight). */
  busy?: boolean;
  className?: string;
  /** Idle copy. */
  label: string;
  /** Copy while the press is being held — the remaining seconds are appended. */
  activeLabel: string;
  /** Copy while `busy`. */
  busyLabel: string;
};

/**
 * Press-and-hold confirmation button. The action only fires after the pointer
 * (or Space/Enter) is held continuously for `holdMs`; releasing early resets
 * the progress. Used for rare, high-friction actions like signing out.
 *
 * The fill bar is driven imperatively via a ref + rAF so the 5s animation
 * doesn't trigger ~300 React re-renders — only the integer countdown does.
 */
export function HoldButton({
  holdMs,
  onComplete,
  disabled,
  busy,
  className,
  label,
  activeLabel,
  busyLabel,
}: Props) {
  const [holding, setHolding] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(holdMs / 1000));
  const fillRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const doneRef = useRef(false);

  const setFill = (p: number) => {
    fillRef.current?.style.setProperty('transform', `scaleX(${p})`);
  };

  const stopRaf = () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const cancel = () => {
    if (doneRef.current) return;
    stopRaf();
    setHolding(false);
    setSecondsLeft(Math.ceil(holdMs / 1000));
    setFill(0);
  };

  const tick = () => {
    // eslint-disable-next-line react-hooks/purity -- performance.now() в rAF-колбэке tick, не в рендере
    const elapsed = performance.now() - startRef.current;
    const progress = Math.min(1, elapsed / holdMs);
    setFill(progress);
    setSecondsLeft(Math.max(0, Math.ceil((holdMs - elapsed) / 1000)));
    if (progress >= 1) {
      doneRef.current = true;
      stopRaf();
      setHolding(false);
      onComplete();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const start = (e?: React.PointerEvent) => {
    if (disabled || busy || doneRef.current || rafRef.current != null) return;
    // Capture the pointer so a slight drift off this 50px-tall button doesn't
    // fire pointerleave and abort the hold. Touch/pen capture implicitly, but
    // mouse does not — without this a drifting cursor resets the 5s timer.
    if (e) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Pointer already released / invalid id — harmless, hold still works.
      }
    }
    setHolding(true);
    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  };

  // Cancel any in-flight rAF if the button unmounts mid-hold.
  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.repeat) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      start();
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') cancel();
  };

  const text = busy
    ? busyLabel
    : holding
      ? `${activeLabel} ${secondsLeft}`
      : label;

  return (
    <button
      type="button"
      className={clsx(styles.holdBtn, holding && styles.holding, className)}
      disabled={disabled || busy}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={label}
    >
      <span ref={fillRef} className={styles.fill} aria-hidden />
      <span className={styles.holdLabel}>{text}</span>
    </button>
  );
}

export default HoldButton;
