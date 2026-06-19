import React, { ButtonHTMLAttributes } from 'react';
import s from './Button.module.css';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'bottomActionBar' | 'brand';
  isLoading?: boolean;
  before?: React.ReactNode;
  /** Ведущая иконка — в span слева от метки (currentColor, fixed-size в варианте). */
  icon?: React.ReactNode;
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

  const content = (
    <>
      {before}
      {icon != null && (
        <span className={s.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {isLoading ? 'Loading...' : children}
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
