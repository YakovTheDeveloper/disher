import type { AriaRole, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import clsx from 'clsx';
import { usePressFeedback } from '@/shared/lib/hooks/usePressFeedback';
import { useLongPress } from '@/shared/lib/hooks/useLongPress';
import s from './FoodListRow.module.scss';

type Props = {
  /** Слот слева (миниатюра var(--rail-thumb, 36px) / бейдж). Его присутствие
   *  ставит data-has-leading → нижний divider тянется от края карточки (0),
   *  без него — от рельсы имён --rail-gutter. */
  leading?: ReactNode;
  title: ReactNode;
  /** Тихая строка под именем (той же колонкой). */
  subtitle?: ReactNode;
  /** Правая числовая колонка (например, NormFigure + GaugeFill из NormGauge). */
  meta?: ReactNode;
  /** Правый слот-кнопка 56px — именно она держит высоту ряда (у .item
   *  вертикального padding НАМЕРЕННО нет). */
  trailing?: ReactNode;
  /** Абсолютно-позиционированный декор поверх ряда (ownerStripe и т.п.) —
   *  рендерится последним внутри позиционированного <li>. */
  overlay?: ReactNode;
  active?: boolean;
  onClick?: () => void;
  /** Долгий тап (~450мс, общий useLongPress: move-cancel 10px + click-suppression,
   *  безопасен в скроллируемом role="option"). Задан → на ряду aria-haspopup="menu". */
  onLongPress?: () => void;
  /** Явный aria-selected; по умолчанию повторяет active. */
  ariaSelected?: boolean;
  /** Задан → главная зона ряда рендерится <label htmlFor>, чтобы тап по имени
   *  фокусировал связанный инпут (ModalByLabel step flows). */
  htmlFor?: string;
  role?: AriaRole;
  /** Якорь консумера на корне <li> — контекстные флипы (plum/press) вешаются на
   *  него + data-active / data-pressed, без знания локальных классов каркаса. */
  className?: string;
};

/**
 * Скелет ряда-карточки еды — выделен из FoodActionCard (2026-07-31, шаг 3 плана
 * tds/task_spec/ЧтоЕщеСъесть.md). Каркас несёт flex-раскладку, нижний divider
 * ::after с фейдом по кончикам, plum-состояние выбора, тёмный press-фидбэк
 * (usePressFeedback + useLongPress, склеенные на одном <li>). Контент — только
 * через слоты; --rail-* (gutter/gap/thumb) — контракт хоста, fallbacks встроены.
 */
const FoodListRow = ({
  leading,
  title,
  subtitle,
  meta,
  trailing,
  overlay,
  active,
  onClick,
  onLongPress,
  ariaSelected,
  htmlFor,
  role,
  className,
}: Props) => {
  const { pressed, pressProps } = usePressFeedback();

  // Press-визуал даёт usePressFeedback (вспышка с MIN_HOLD на мгновенном тапе,
  // важно для htmlFor-переходов); жест — useLongPress. Оба слушают pointer на
  // ОДНОМ узле (`<li>`): useLongPress ставит pointer-capture на него, поэтому
  // release-события usePressFeedback должны прийти туда же — склеиваем
  // перекрывающиеся хендлеры (move/clickCapture/contextMenu — из press).
  const press = useLongPress(onLongPress);
  const liHandlers = {
    ...press,
    onPointerDown: (e: ReactPointerEvent) => {
      pressProps.onPointerDown();
      press.onPointerDown(e);
    },
    onPointerUp: (e: ReactPointerEvent) => {
      pressProps.onPointerUp();
      press.onPointerUp(e);
    },
    onPointerCancel: (e: ReactPointerEvent) => {
      pressProps.onPointerCancel();
      press.onPointerCancel(e);
    },
    onPointerLeave: (e: ReactPointerEvent) => {
      pressProps.onPointerLeave();
      press.onPointerLeave(e);
    },
  };

  const main = (
    <>
      {leading}
      <span className={s.nameCol}>
        {title}
        {subtitle}
      </span>
    </>
  );

  // Клавиатурная доступность кликабельного ряда без htmlFor: htmlFor-ветка
  // фокусируется через связанный инпут (ModalByLabel), а plain-ряд без неё из
  // tab-порядка выпадал. Фокус и Enter/Space вешаем на <li> — он и есть
  // role="option"/кнопка ряда; htmlFor-путь НЕ трогаем (там фокус — инпуту).
  const keyboardClick = !htmlFor && onClick;
  const handleKeyDown = keyboardClick
    ? (e: ReactKeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }
    : undefined;

  return (
    <li
      className={clsx(s.wrapper, className)}
      role={role ?? (keyboardClick ? 'button' : undefined)}
      tabIndex={keyboardClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
      aria-selected={ariaSelected ?? active ?? undefined}
      aria-haspopup={onLongPress ? 'menu' : undefined}
      data-active={active || undefined}
      data-pressed={pressed || undefined}
      data-has-leading={leading ? '' : undefined}
      {...liHandlers}
    >
      {htmlFor ? (
        <label
          htmlFor={htmlFor}
          className={s.item}
          onClick={() => {
            onClick?.();
          }}
        >
          {main}
        </label>
      ) : (
        <p
          className={s.item}
          onClick={() => {
            onClick?.();
          }}
        >
          {main}
        </p>
      )}
      {meta}
      {trailing}
      {overlay}
    </li>
  );
};

export default FoodListRow;
