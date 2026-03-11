import { useRef, useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import styles from './Selectable.module.scss';
import TickIcon from '@/assets/icons/tick.svg';

type Props = {
  id: string;
  children: React.ReactNode;
  isSelectMode: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onClick?: () => void;
  className?: string;
  hasCheckbox?: boolean;
  selectedClassName?: string;
};

const LONG_PRESS_DELAY = 450;
const MOVE_THRESHOLD = 10;

const Selectable = ({
  id,
  children,
  isSelectMode,
  isSelected,
  onSelect,
  onClick,
  className,
  hasCheckbox = true,
  selectedClassName,
}: Props) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const isPendingRef = useRef(false);
  const wasLongPressedRef = useRef(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleSelect = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    onSelect(id);
  }, [onSelect, id]);

  const cleanUp = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isPendingRef.current = false;
    setIsPressed(false);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;

    isPendingRef.current = true;
    wasLongPressedRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    setIsPressed(true);

    timerRef.current = setTimeout(() => {
      if (isPendingRef.current) {
        wasLongPressedRef.current = true;
        handleSelect();
        setIsPressed(false);
      }
    }, LONG_PRESS_DELAY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isPendingRef.current) return;

    const shiftX = Math.abs(e.clientX - startPosRef.current.x);
    const shiftY = Math.abs(e.clientY - startPosRef.current.y);

    if (shiftX > MOVE_THRESHOLD || shiftY > MOVE_THRESHOLD) {
      cleanUp();
    }
  };

  const onPointerUp = () => {
    const skipTap = wasLongPressedRef.current;
    cleanUp();

    if (!skipTap && isSelectMode) {
      handleSelect();
    }

    if (!skipTap && !isSelectMode && onClick) {
      onClick();
    }
  };

  const onContextMenu = (e: React.MouseEvent) => {
    if (wasLongPressedRef.current) {
      e.preventDefault();
    }
  };

  return (
    <motion.div
      layout
      className={clsx(styles.container, isSelected && styles.selected, isSelected && selectedClassName, isSelectMode && styles.inSelectMode)}
      onContextMenu={onContextMenu}
    >
      {hasCheckbox && (
        <AnimatePresence>
          {isSelectMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5, x: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={styles.checkbox}
            >
              <button
                type="button"
                className={clsx(styles.checkboxButton, isSelected && styles.checkboxButton_selected)}
                onClick={handleSelect}
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
      )}

      {isSelected && <div className={styles.selectedOverlay} />}

      <motion.div
        animate={{ x: hasCheckbox && isSelectMode ? 44 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerMove={onPointerMove}
        onPointerCancel={cleanUp}
        onPointerLeave={cleanUp}
        className={clsx(
          styles.content,
          className,
          isSelectMode && styles.content_inSelectMode,
          isPressed && styles.content_pressed
        )}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

export default observer(Selectable);
