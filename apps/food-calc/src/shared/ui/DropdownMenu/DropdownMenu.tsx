import type { ComponentProps, ReactNode } from 'react';
import clsx from 'clsx';
import { Menu } from '@base-ui/react/menu';
import s from './DropdownMenu.module.scss';

type MenuItemProps = ComponentProps<typeof Menu.Item>;
type Side = ComponentProps<typeof Menu.Positioner>['side'];
type Align = ComponentProps<typeof Menu.Positioner>['align'];

interface DropdownMenuProps {
  /** Содержимое кнопки-триггера (иконка / текст). */
  trigger: ReactNode;
  /** sr-метка триггера (у icon-only кнопки нет видимого текста). */
  triggerAriaLabel: string;
  /** Класс кнопки-триггера (визуал — на вызывающем). */
  triggerClassName?: string;
  /** Пункты меню — `<DropdownMenuItem>`. */
  children: ReactNode;
  side?: Side;
  align?: Align;
  sideOffset?: number;
  /** Доп. класс на popup. */
  className?: string;
}

/**
 * Заякоренный dropdown-примитив на Base UI Menu. Меню само владеет открытием,
 * позиционированием (anchor = триггер), click-outside и порталом — вызывающему
 * не нужны `position:absolute` / ручной бэкдроп / собственный open-стейт.
 *
 * `modal={false}` — лёгкий dropdown (не лочит скролл/страницу), закрывается по
 * outside-press и focus-out (заменяет ручной бэкдроп). `finalFocus={false}` —
 * при закрытии фокус НЕ возвращается на триггер; это нужно для пунктов-`<label
 * htmlFor>` (focus-делегация на input ради iOS-клавиатуры, см. feedback_ios_focus):
 * фокус остаётся на инпуте, клавиатура не схлопывается. Enter-анимация работает,
 * т.к. меню монтируется по open (false→true даёт `data-starting-style`,
 * baseui-mount-phase) — CSS-переход в .module.scss.
 *
 * Экспортит только компоненты (Fast Refresh — fastrefresh-screenindicator).
 */
export function DropdownMenu({
  trigger,
  triggerAriaLabel,
  triggerClassName,
  children,
  side = 'bottom',
  align = 'end',
  sideOffset = 4,
  className,
}: DropdownMenuProps) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger className={triggerClassName} aria-label={triggerAriaLabel}>
        {trigger}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          className={s.positioner}
          side={side}
          align={align}
          sideOffset={sideOffset}
        >
          <Menu.Popup className={clsx(s.popup, className)} finalFocus={false}>
            {children}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

interface DropdownMenuItemProps
  extends Pick<MenuItemProps, 'onClick' | 'closeOnClick' | 'render' | 'disabled'> {
  children: ReactNode;
  className?: string;
}

/**
 * Пункт меню. Через `render` можно подменить тег (напр. `<label htmlFor>` для
 * focus-делегации); `closeOnClick={false}` оставляет меню открытым на клике
 * (нужно для label — закрытие приедет focus-out'ом ПОСЛЕ делегации фокуса).
 */
export function DropdownMenuItem({
  children,
  className,
  onClick,
  closeOnClick,
  render,
  disabled,
}: DropdownMenuItemProps) {
  return (
    <Menu.Item
      className={clsx(s.item, className)}
      onClick={onClick}
      closeOnClick={closeOnClick}
      render={render}
      disabled={disabled}
    >
      {children}
    </Menu.Item>
  );
}
