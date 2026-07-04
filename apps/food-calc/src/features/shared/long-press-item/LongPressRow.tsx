import React, { useEffect, useState } from 'react';
import styles from './LongPressRow.module.scss';
import clsx from 'clsx';
import { useEntranceStagger } from '@/shared/lib/hooks/useEntranceStagger';
import { useLongPress } from '@/shared/lib/hooks/useLongPress';
import { isJustAdded, takeJustAdded } from '@/shared/model/recentlyAddedStore';

import type { TimeOfDay } from '@/shared/lib/time-of-day';

type Props = {
  /** Row identity — published as `data-row-id` (scroll/anchor target). */
  id: string;
  children?: React.ReactNode;
  className?: string;
  innerClassName?: string;
  style?: React.CSSProperties;
  /** Position in the list — drives the staggered entrance cascade. */
  index?: number;
  tod?: TimeOfDay;
  onClick?: () => void;
  /** Fired on a sustained press (~450ms) OR its keyboard equivalent (Shift+F10 /
   *  context-menu key). Used to open the per-item action drawer. When omitted, a
   *  long press is a no-op (e.g. free-text rows that only borrow the surface). */
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
  style,
  index,
  tod,
  onClick,
  onLongPress,
  ...rest
}: Props) => {
  const entrance = useEntranceStagger(index);
  // Разовое «этот ряд только что добавлен»: читаем ящик РАЗ на первом рендере
  // (isJustAdded — чисто, StrictMode-безопасно), класс `.row_recent` уезжает в
  // первый commit → React владеет им и не переиграет. Потребляем в эффекте
  // (сайд-эффект вне рендера) — повторный маунт (ре-рендер списка, StrictMode) уже
  // не увидит id в ящике, так что flash проигрывается ровно один раз. Заморожено:
  // тоггла в течение жизни ряда нет → ни переигрыша, ни моргания.
  const [isNew] = useState(() => isJustAdded(id));
  useEffect(() => {
    if (isNew) takeJustAdded(id);
  }, [isNew, id]);
  // Только что добавленный ряд НЕ играет entrance-каскад: каскад — для ВХОДА НА
  // ЭКРАН (весь список наплывает по stagger), а одиночное добавление должно
  // появиться СРАЗУ непрозрачным и дать flash-подсветке (::before) отыграть на
  // полную. Иначе butter-пик светит сквозь ещё прозрачный (opacity 0→1) ряд —
  // видимая часть вспышки куцая (баг «слишком быстро», 2026-07-03). Обычная const:
  // isNew заморожен на маунте, тоггла нет.
  const showEntrance = !isNew;
  // Extract data-* attributes
  const dataAttrs = Object.fromEntries(
    Object.entries(rest).filter(([key]) => key.startsWith('data-'))
  );
  const [isPressed, setIsPressed] = useState(false);

  // Gesture is owned by the shared headless hook (450ms / 10px move-cancel /
  // pointer-capture / click-suppression). The hook drives the press-visual via
  // onPressStart/End so we don't re-track the FSM just for the scale affordance.
  const press = useLongPress(onLongPress, {
    delay: LONG_PRESS_DELAY,
    moveThreshold: MOVE_THRESHOLD,
    onPressStart: () => setIsPressed(true),
    onPressEnd: () => setIsPressed(false),
  });

  const interactive = Boolean(onClick || onLongPress);

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Only act when the row itself is focused — never hijack keys from inner
    // inputs/buttons (inline qty/time editors, rescue/delete controls).
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    } else if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
      // Keyboard path to the long-press action drawer (context-menu key / Shift+F10).
      e.preventDefault();
      onLongPress?.();
    }
  };

  // Single node: the <li> IS the card surface, the gesture target, the entrance
  // layer and the just-added flash host (`::before`). Tap = native onClick (pointer) +
  // Enter/Space (keyboard); long-press action = sustained press / mouse-hold /
  // Shift+F10 / context-menu key — see tds/ANALYSIS/longpressrow-collapse-2026-06-25.md.
  return (
    <li
      data-row-id={id}
      data-tod={tod}
      tabIndex={interactive ? 0 : undefined}
      aria-haspopup={onLongPress ? 'menu' : undefined}
      onClick={onClick}
      onKeyDown={interactive ? onKeyDown : undefined}
      {...press}
      style={{ ...(showEntrance ? entrance.style : null), ...style }}
      className={clsx(
        className,
        innerClassName,
        styles.row,
        showEntrance && entrance.className,
        isPressed && styles.row_tapped,
        isNew && styles.row_recent
      )}
      {...dataAttrs}
    >
      {children}
    </li>
  );
};

export default LongPressRow;
