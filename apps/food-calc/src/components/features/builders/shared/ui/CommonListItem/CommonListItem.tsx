import React, { useRef, useState, useCallback, useEffect } from 'react';
import styles from './CommonListItem.module.scss';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import { Instance } from 'mobx-state-tree';
import { SyncStatus } from '@/domain/commonListItem';
import TickIcon from '@/assets/icons/tick.svg';
import { domainStore } from '@/store/store';
import { AnimatePresence, motion } from 'framer-motion';
import { emitter } from '@/infrastructure/emitter/emitter';
type Props = {
  id: string | number;
  children?: React.ReactNode;
  className?: string;
  innerClassName?: string;
  sync?: Instance<typeof SyncStatus>;
  variant?: 1 | 2 | 3;
};

const LONG_PRESS_DELAY = 450;
const MOVE_THRESHOLD = 10; // Pixels allowed before canceling long press

const ListItem = ({ id, children, className, innerClassName, sync, variant }: Props) => {
  const stringId = id.toString();
  const [isHighlighted, setIsHighlighted] = useState(false);

  const interactionsSelect = domainStore.interactionsService.interactionsSelect;

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
  const isActionsMode = interactionsSelect.isActionsMode;
  const isSelected = interactionsSelect.isSelected(stringId);

  const handleSelect = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    interactionsSelect.toggleSelectedId(stringId);
  }, [interactionsSelect, stringId]);

  const cleanUp = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isPendingRef.current = false;
    setIsPressed(false);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (isActionsMode) {
      preventNextClickRef.current = true;
    }

    // Only support primary mouse button / touch
    if (e.button !== 0) return;

    // e.currentTarget.setPointerCapture(e.pointerId);
    log(`${e.pointerId}`, 'red');

    isPendingRef.current = true;
    wasLongPressedRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    setIsPressed(true);

    timerRef.current = setTimeout(() => {
      if (isPendingRef.current) {
        wasLongPressedRef.current = true;

        log('блокирую кнопку', 'red');
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

    // If user scrolls or moves significantly, cancel the selection timer
    if (shiftX > MOVE_THRESHOLD || shiftY > MOVE_THRESHOLD) {
      cleanUp();
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    // log('pointer UP', 'red');

    const skipTap = wasLongPressedRef.current;

    cleanUp();

    // If we're already in multi-select mode, any short tap should toggle
    if (!skipTap && isActionsMode) {
      handleSelect();
    }

    setTimeout(() => {
      // log('разблокировал кнопку', 'green');
      preventNextClickRef.current = false;
    }, 50);
  };

  const onContextMenu = (e: React.MouseEvent) => {
    // Prevent system context menu if we just triggered a long press
    if (wasLongPressedRef.current) {
      e.preventDefault();
    }
  };

  const onSelectButtonClick = (e) => {
    // log('click button', 'orange');
    if (preventNextClickRef.current) {
      return;
    }
    handleSelect();
  };

  const status = sync?.status;

  return (
    <motion.div
      layout
      whileTap={{ scale: 0.98 }}
      className={clsx(
        styles.commonListItemWrapper,
        isSelected && styles.selected,
        isActionsMode && styles.inActionsMode
      )}
      onContextMenu={onContextMenu}
    >
      <AnimatePresence>
        {isActionsMode && (
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
        animate={{ x: isActionsMode ? 44 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerMove={onPointerMove}
        onPointerCancel={cleanUp}
        onPointerLeave={cleanUp}
        className={clsx(
          className,
          innerClassName,
          styles.commonListItemInner,
          isActionsMode && styles.commonListItemInner_inActionsMode,
          isPressed && styles.commonListItemInner_tapped,
          status && styles[status],
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
          className={clsx(styles.content, isActionsMode && styles.content_disabled)}
        >
          {children}
        </div>
      </motion.li>
    </motion.div>
  );
};

export default observer(ListItem);
