import React, { useRef, useState, useCallback, useEffect } from 'react';
import styles from './LongPressRow.module.scss';
import clsx from 'clsx';
import { emitter } from '@/shared/lib/emitter/emitter';
import { useEntranceStagger } from '@/shared/lib/hooks/useEntranceStagger';

import type { TimeOfDay } from '@/shared/lib/time-of-day';

type Props = {
  id: string;
  children?: React.ReactNode;
  className?: string;
  innerClassName?: string;
  wrapperClassName?: string;
  style?: React.CSSProperties;
  variant?: 1 | 2 | 3;
  /** Position in the list — drives the staggered entrance cascade. */
  index?: number;
  tod?: TimeOfDay;
  /** «Недавно добавлен» marker — синий кружок в правом жёлобе ВНЕ подложки
   *  карточки (recent-dot canon). Жёлоб открывается только когда true. */
  recent?: boolean;
  onClick?: () => void;
  /** Fired on a sustained press (~450ms). Used to open the per-item action
   *  drawer. When omitted, a long press is a no-op (e.g. free-text rows that
   *  only borrow the surface styling). */
  onLongPress?: () => void;
  [key: `data-${string}`]: string | undefined;
};

const LONG_PRESS_DELAY = 450;
const MOVE_THRESHOLD = 10; // Pixels allowed before canceling long press

const LongPressRow = ({
  id,
  children,
  className,
  innerClassName,
  wrapperClassName,
  style,
  variant,
  index,
  tod,
  recent,
  onClick,
  onLongPress,
  ...rest
}: Props) => {
  const entrance = useEntranceStagger(index);
  // Extract data-* attributes
  const dataAttrs = Object.fromEntries(
    Object.entries(rest).filter(([key]) => key.startsWith('data-'))
  );
  const stringId = id.toString();
  const [isHighlighted, setIsHighlighted] = useState(false);

  // Emitter subscription for highlight animation
  useEffect(() => {
    const handler = ({ id: highlightedId }: { id: string | number }) => {
      if (highlightedId.toString() === stringId) {
        setIsHighlighted(true);
        setTimeout(() => setIsHighlighted(false), 3000);
      }
    };
    emitter.on('HIGHLIGHT_ITEM', handler);
    return () => emitter.off('HIGHLIGHT_ITEM', handler);
  }, [stringId]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const isPendingRef = useRef(false);
  const wasLongPressedRef = useRef(false);
  const preventNextClickRef = useRef(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleLongPress = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    onLongPress?.();
  }, [onLongPress]);

  const cleanUp = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isPendingRef.current = false;
    setIsPressed(false);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    // Ignore middle/right mouse buttons; primary (0), touch and pen (button 0)
    // proceed. `> 0` (not `!== 0`) tolerates environments where `button` is
    // absent on a programmatic event.
    if (e.button > 0) return;

    // Capture pointer so browser can't steal it for scrolling / label handling
    (e.target as Element).setPointerCapture(e.pointerId);

    isPendingRef.current = true;
    wasLongPressedRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    setIsPressed(true);

    // No long-press affordance when the consumer didn't ask for one.
    if (!onLongPress) return;

    timerRef.current = setTimeout(() => {
      if (isPendingRef.current) {
        wasLongPressedRef.current = true;
        preventNextClickRef.current = true;
        handleLongPress();
        // Visual indicator that press succeeded
        setIsPressed(false);
      }
    }, LONG_PRESS_DELAY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isPendingRef.current) return;

    const shiftX = Math.abs(e.clientX - startPosRef.current.x);
    const shiftY = Math.abs(e.clientY - startPosRef.current.y);

    // If user scrolls or moves significantly, release capture and cancel
    if (shiftX > MOVE_THRESHOLD || shiftY > MOVE_THRESHOLD) {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
      cleanUp();
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    // `started` is false when the press never began (non-primary button →
    // onPointerDown bailed) or was cancelled by a move/leave — in those cases a
    // tap must NOT synthesize onClick.
    const started = isPendingRef.current;
    const skipTap = wasLongPressedRef.current;

    cleanUp();

    // A short tap (press started, not a completed long press) fires onClick.
    if (started && !skipTap && onClick) {
      onClick();
    }

    setTimeout(() => {
      preventNextClickRef.current = false;
    }, 50);
  };

  const onContextMenu = (e: React.MouseEvent) => {
    // Prevent system context menu if we just triggered a long press
    if (wasLongPressedRef.current) {
      e.preventDefault();
    }
  };

  return (
    <div
      className={clsx(
        styles.commonListItemWrapper,
        wrapperClassName,
        entrance.className
      )}
      style={entrance.style}
      data-tod={tod}
      onContextMenu={onContextMenu}
      {...dataAttrs}
    >
      <li
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerMove={onPointerMove}
        onPointerCancel={(e) => {
          (e.target as Element).releasePointerCapture?.(e.pointerId);
          cleanUp();
        }}
        onPointerLeave={cleanUp}
        style={style}
        className={clsx(
          className,
          innerClassName,
          styles.commonListItemInner,
          isPressed && styles.commonListItemInner_tapped,
          variant && styles[`variant_${variant}`],
          isHighlighted && styles.highlighted
        )}
      >
        <div
          onClickCapture={(e) => {
            if (preventNextClickRef.current) {
              // stopPropagation blocks React onClicks inside the row;
              // preventDefault cancels the NATIVE <label htmlFor> activation —
              // otherwise a long-press over a food-name/quantity label would
              // focus its input and pop an inline-edit modal underneath the
              // just-opened action drawer (stopPropagation alone doesn't stop a
              // default action).
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          className={styles.content}
        >
          {children}
        </div>
      </li>
      {recent && <span className={styles.recentDot} aria-hidden="true" />}
    </div>
  );
};

export default LongPressRow;
