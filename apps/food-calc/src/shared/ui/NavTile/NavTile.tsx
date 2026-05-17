import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';
import s from './NavTile.module.scss';

export type NavTileProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Подпись плитки — serif italic у нижнего края. */
  label: string;
  /** Фоновая картинка-призрак (приглушённая), опционально. */
  image?: string;
  /** Активная/выбранная плитка — тёмная рамка, приглушённые подпись и картинка. */
  active?: boolean;
  /** Подпись остаётся чёрной и непрозрачной даже у active-плитки. */
  solidLabel?: boolean;
};

/**
 * NavTile — квадратная навигационная плитка: пунктирная рамка,
 * фоновая картинка-призрак, serif-italic подпись у нижнего края.
 *
 * Паттерн извлечён из HomePage `ScreenIndicator` (исходный «before
 * redesign»-вид). Переиспользуется выбором атома в `AtomBuilder`.
 * Поведение (grid-позиция, выбор, role/aria) задаётся снаружи через
 * passthrough-пропсы.
 *
 * Положение картинки-призрака настраивается CSS-переменными — через
 * `style` или `className` потребителя (composite-only сдвиг/масштаб):
 *   --tile-img-x       сдвиг по горизонтали, + вправо   (default 0px)
 *   --tile-img-y       сдвиг по вертикали,  + вниз       (default 10px)
 *   --tile-img-scale   масштаб, >1 — плотнее обрезка     (default 1)
 *   --tile-img-opacity прозрачность                     (default 0.07)
 */
export const NavTile = ({
  label,
  image,
  active,
  solidLabel,
  className,
  ...rest
}: NavTileProps) => (
  <button
    type="button"
    className={clsx(s.tile, active && s.tileActive, solidLabel && s.tileSolidLabel, className)}
    {...rest}
  >
    {image && <img src={image} className={s.tileImg} alt="" aria-hidden />}
    <span className={s.tileTitle}>{label}</span>
  </button>
);

export default NavTile;
