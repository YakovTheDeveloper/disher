import React, { FC, ButtonHTMLAttributes } from "react";
import s from "./Button.module.css";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "danger";
  isLoading?: boolean;
  before?: React.ReactNode;
}

const Button: FC<ButtonProps> = ({
  before,
  children,
  variant = "primary",
  isLoading = false,
  className,
  ...props
}) => {
  const buttonClasses = clsx(
    s.button,
    s[variant],
    props.disabled && s.disabled,
    className
  );

  return (
    <button
      className={buttonClasses}
      disabled={isLoading || props.disabled} // Disable button during loading
      {...props}
    >
      {before}
      {isLoading ? "Loading..." : children}
    </button>
  );
};

export default Button;
