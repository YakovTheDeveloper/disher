import React, { ButtonHTMLAttributes } from 'react';
import s from './Button.module.css';
import clsx from 'clsx';
import { Text } from '@/shared/ui/atoms/Typography/Text';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'link' | 'ghost' | 'brand';
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

const Button: ButtonComponent = ({
  before,
  icon,
  trailingIcon,
  children,
  variant = 'primary',
  isLoading = false,
  className,
  center,
  type = 'button',
  as = 'button',
  htmlFor,
  ...props
}) => {
  const buttonClasses = clsx(
    s.button,
    s[variant],
    props.disabled && s.disabled,
    className,
    center && s.center
  );

  // Подпись кнопки несёт типо-РОЛЬ через <Text> (миграция «везде на Text»,
  // 2026-06-24): action-варианты → label (16/600), link → body (16/500), ghost —
  // bespoke (italic 200, роли нет) → без <Text>, размер из CSS (size-токен).
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
    return (
      <label
        className={buttonClasses}
        htmlFor={htmlFor}
        onClick={props.onClick as unknown as React.MouseEventHandler<HTMLLabelElement>}
      >
        {content}
      </label>
    );
  }

  return (
    <button
      className={buttonClasses}
      disabled={isLoading || props.disabled} // Disable button during loading
      type={type}
      {...props}
    >
      {content}
    </button>
  );
};

export default Button;
