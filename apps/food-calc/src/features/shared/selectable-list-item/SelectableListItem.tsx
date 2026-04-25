import React, { useRef, useState, useCallback, useEffect } from 'react';
import styles from './SelectableListItem.module.scss';
import clsx from 'clsx';
import TickIcon from '@/shared/assets/icons/tick.svg';
import { AnimatePresence, motion } from 'motion/react';
import { emitter } from '@/shared/lib/emitter/emitter';

import type { TimeOfDay } from '@/shared/lib/time-of-day';

type Props = {
  id: string;
  children?: React.ReactNode;
  className?: string;
  innerClassName?: string;
  style?: React.CSSProperties;
  variant?: 1 | 2 | 3;
  tod?: TimeOfDay;
  isSelectMode: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onClick?: () => void;
  [key: `data-${string}`]: string | undefined;
};

const LONG_PRESS_DELAY = 450;
const MOVE_THRESHOLD = 10; // Pixels allowed before canceling long press

const ListItem = ({
  id,
  children,
  className,
  innerClassName,
  style,
  variant,
  tod,
  isSelectMode,
  isSelected,
  onSelect,
  onClick,
  ...rest
}: Props) => {
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

  const handleSelect = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    onSelect(stringId);
  }, [onSelect, stringId]);

  const cleanUp = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isPendingRef.current = false;
    setIsPressed(false);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (isSelectMode) {
      preventNextClickRef.current = true;
    }

    // Only support primary mouse button / touch
    if (e.button !== 0) return;

    // Capture pointer so browser can't steal it for scrolling / label handling
    (e.target as Element).setPointerCapture(e.pointerId);

    isPendingRef.current = true;
    wasLongPressedRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    setIsPressed(true);

    timerRef.current = setTimeout(() => {
      if (isPendingRef.current) {
        wasLongPressedRef.current = true;
        preventNextClickRef.current = true;
        handleSelect();
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
    const skipTap = wasLongPressedRef.current;

    cleanUp();

    // If we're already in multi-select mode, any short tap should toggle
    if (!skipTap && isSelectMode) {
      handleSelect();
    }

    // If NOT in select mode and NOT long pressed, fire onClick
    if (!skipTap && !isSelectMode && onClick) {
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

  const onSelectButtonClick = (_e: React.MouseEvent) => {
    if (preventNextClickRef.current) {
      return;
    }
    handleSelect();
  };

  return (
    <motion.div
      layout
      whileTap={{ scale: 0.98 }}
      className={clsx(
        styles.commonListItemWrapper,
        isSelected && styles.selected,
        isSelectMode && styles.inActionsMode
      )}
      data-tod={tod}
      onContextMenu={onContextMenu}
      {...dataAttrs}
    >
      <AnimatePresence>
        {isSelectMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.5, x: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={styles.selectCheckbox}
          >
            <button
              type="button"
              className={clsx(styles.selectButton, isSelected && styles.selectButton_selected)}
              onClick={onSelectButtonClick}
            >
              <AnimatePresence mode="wait">
                {isSelected && (
                  <motion.div
                    key="tick"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                  >
                    <TickIcon />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isSelected && <div className={styles.selectedOverlay} />}

      <motion.li
        animate={{ x: isSelectMode ? 44 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
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
          isSelectMode && styles.commonListItemInner_inActionsMode,
          isPressed && styles.commonListItemInner_tapped,
          variant && styles[`variant_${variant}`],
          isHighlighted && styles.highlighted
        )}
      >
        <div
          onClickCapture={(e) => {
            if (preventNextClickRef.current) {
              e.stopPropagation();
            }
          }}
          className={clsx(styles.content, isSelectMode && styles.content_disabled)}
        >
          {children}
        </div>
      </motion.li>
    </motion.div>
  );
};

export default ListItem;
