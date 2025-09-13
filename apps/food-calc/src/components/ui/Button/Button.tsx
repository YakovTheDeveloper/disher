import React, { FC, ButtonHTMLAttributes } from 'react';
import s from './Button.module.css';
import clsx from 'clsx';
import { Menu } from './Menu';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
  isLoading?: boolean;
  before?: React.ReactNode;
  center?: boolean;
}

type ButtonComponent = React.FC<ButtonProps> & {
  Menu: typeof Menu;
};

const Button: ButtonComponent = ({
  before,
  children,
  variant = 'primary',
  isLoading = false,
  className,
  center,
  type = 'button',
  ...props
}) => {
  const buttonClasses = clsx(
    s.button,
    s[variant],
    props.disabled && s.disabled,
    className,
    center && s.center
  );

  return (
    <button
      className={buttonClasses}
      disabled={isLoading || props.disabled} // Disable button during loading
      type={type}
      {...props}
    >
      {before}
      {isLoading ? 'Loading...' : children}
    </button>
  );
};

Button.Menu = Menu;

export default Button;
