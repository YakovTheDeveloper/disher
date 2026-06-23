import { useEffect, useRef } from 'react';
import { AtomBuilder } from '@/widgets/ScheduleEvents/components/AtomBuilder';
import s from './EventScalePanel.module.scss';

/**
 * EventScalePanel — the inline rating sheet shown below the Events write-bar.
 *
 * Rendered ONLY while open, and lives in the bottom-bar's normal flow: the
 * (bottom-pinned) bar is simply pushed up — no transforms, no below-fold tricks.
 * Keyboard coexistence (a field here raising the keyboard) is handled by the
 * shared `useKeyboardStick` on the dock in EventsWriteBar.
 *
 * Opens keyboard-DOWN (`autoFocusScaleValue={false}`) so it sits in the keyboard's
 * place; tapping a field raises the keyboard and the dock rides above it. Closing
 * is the bar's «+»→chevron toggle (or hardware back).
 */
export const EventScalePanel = () => {
  const ref = useRef<HTMLDivElement>(null);

  // Move focus into the sheet so screen readers announce it — onto the container
  // (not a field) and preventScroll, so the keyboard stays DOWN on open.
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div ref={ref} className={s.panel} role="dialog" aria-label="Оценка состояния" tabIndex={-1}>
      <AtomBuilder autoFocusScaleValue={false} />
    </div>
  );
};

export default EventScalePanel;
