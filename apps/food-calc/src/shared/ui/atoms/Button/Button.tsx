import React, { ButtonHTMLAttributes } from 'react';
import s from './Button.module.css';
import clsx from 'clsx';
import { Text } from '@/shared/ui/atoms/Typography/Text';

// Ось ТОНА × ось ГРОМКОСТИ. Тона: system (уголь, строгий монохром) · primary
// (амбра, бренд) · accent (индиго, холодный). Громкость: filled (сплошная) и
// `-secondary` (тихий soft-tonal ярус). link/ghost — текстовые утилиты (ссылка /
// тихая «отмена»), вне тоновой оси. Цвета — sys-токены `--sys-color-surface-action-*`.
export type ButtonVariant =
  | 'system'
  | 'primary'
  | 'accent'
  | 'system-secondary'
  | 'primary-secondary'
  | 'accent-secondary'
  | 'link'
  | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /**
   * Плоский режим для secondary-кнопок, лежащих НА поверхности как часть
   * смыслового блока (нижний бар дока). Снимает тень — стандалон-кнопка остаётся
   * с тенью. Через проп, а не [data-surface] (per-surface темизация запрещена).
   */
  flat?: boolean;
  /**
   * Полная ширина (width:100%). Ширина ортогональна тону — её объявляет консумер
   * (этим пропом или родительским flex), а не вшита в variant.
   */
  fullWidth?: boolean;
  isLoading?: boolean;
  before?: React.ReactNode;
  /** Ведущая иконка — в span слева от метки (currentColor, fixed-size в варианте). */
  icon?: React.ReactNode;
  /** Ведомая иконка — в span справа от метки (напр. стрелка «Далее» в футере). */
  trailingIcon?: React.ReactNode;
  center?: boolean;
  /**
   * Render-тег. `label` + `htmlFor` — для ModalByLabel focus-делегации
   * (кнопка-триггер модалки, напр. «Добавить событие» в нижнем баре).
   */
  as?: 'button' | 'label';
  htmlFor?: string;
}

type ButtonComponent = React.FC<ButtonProps>;

// variant → CSS-класс. Имена тонов с дефисом (`system-secondary`) не маппятся
// 1:1 на CSS-module ключи, поэтому маппинг явный (camelCase в модуле).
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  system: s.system,
  primary: s.primary,
  accent: s.accent,
  'system-secondary': s.systemSecondary,
  'primary-secondary': s.primarySecondary,
  'accent-secondary': s.accentSecondary,
  link: s.link,
  ghost: s.ghost,
};

const Button: ButtonComponent = ({
  before,
  icon,
  trailingIcon,
  children,
  variant = 'system',
  flat = false,
  fullWidth = false,
  isLoading = false,
  className,
  center,
  type = 'button',
  as = 'button',
  htmlFor,
  // disabled/onClick деструктурируем отдельно: иначе `disabled={…}` ДО `{...props}`
  // спред перезатирал бы атрибут, а label-ветка теряла бы onClick.
  disabled,
  onClick,
  ...props
}) => {
  // disabled-вид вешаем и на isLoading (загрузка = временно недоступна), и на
  // disabled. Класс `.disabled` несёт pointer-events:none — это и есть
  // блокировка в as="label" режиме (у <label> нет disabled-атрибута).
  const isDisabled = Boolean(isLoading || disabled);

  const buttonClasses = clsx(
    s.button,
    VARIANT_CLASS[variant],
    flat && s.flat,
    fullWidth && s.fullWidth,
    isDisabled && s.disabled,
    className,
    center && s.center
  );

  // Подпись кнопки несёт типо-РОЛЬ через <Text> (миграция «везде на Text»,
  // 2026-06-24): tone-варианты (filled + secondary) → label (16/600), link → body
  // (16/500), ghost — bespoke (italic, роли нет) → без <Text>, размер из CSS.
  const labelRole: 'label' | 'body' | null =
    variant === 'ghost' ? null : variant === 'link' ? 'body' : 'label';
  const labelNode = isLoading ? 'Loading...' : children;

  const content = (
    <>
      {before}
      {icon != null && (
        <span className={s.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {labelRole ? (
        <Text as="span" role={labelRole}>
          {labelNode}
        </Text>
      ) : (
        labelNode
      )}
      {trailingIcon != null && (
        <span className={s.icon} aria-hidden="true">
          {trailingIcon}
        </span>
      )}
    </>
  );

  // ModalByLabel-режим: <label htmlFor> делегирует фокус в скрытый input →
  // открывает шаг модалки. disabled/type не применимы к label.
  if (as === 'label') {
    // {...props} спредим, чтобы aria-*/data-* не терялись. disabled на label
    // невалиден; блокировку держат снятый htmlFor + guard onClick + .disabled
    // (pointer-events:none). aria-disabled на <label> не ставим — он не контрол,
    // SR его игнорит, реальная блокировка уже трёхслойная.
    return (
      <label
        {...(props as React.HTMLAttributes<HTMLLabelElement>)}
        className={buttonClasses}
        htmlFor={isDisabled ? undefined : htmlFor}
        onClick={
          isDisabled
            ? undefined
            : (onClick as unknown as React.MouseEventHandler<HTMLLabelElement>)
        }
      >
        {content}
      </label>
    );
  }

  // {...props} ПЕРВЫМ — наши контролируемые атрибуты (disabled/type/onClick)
  // объявлены после и не могут быть перезатёрты спредом.
  return (
    <button
      {...props}
      className={buttonClasses}
      disabled={isDisabled}
      type={type}
      onClick={onClick}
    >
      {content}
    </button>
  );
};

export default Button;
