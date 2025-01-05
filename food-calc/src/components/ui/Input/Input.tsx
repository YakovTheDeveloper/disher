import React, { useState, forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import styles from './Input.module.css';
import { TypographyProps } from '@/components/ui/Typography/Typography';
import clsx from 'clsx';
import typoStyle from '@/components/ui/Typography/Typography.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: ReactNode;
    error?: string;
    helperText?: string;
    showPasswordToggle?: boolean;
    typographyVariant?: TypographyProps['variant'];
    before?: ReactNode; // Slot for left-side icon/button
    after?: ReactNode;  // Slot for right-side icon/button
    wrapperClassName?: string;  // Slot for right-side icon/button
    className?: string;  // Slot for right-side icon/button
    size?: 'small' | 'medium'
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    helperText,
    showPasswordToggle = false,
    typographyVariant,
    before,
    after,
    wrapperClassName,
    className,
    type,
    size = 'medium',
    ...props
}, ref) => {
    const [isPasswordVisible, setPasswordVisible] = useState(false);

    const togglePasswordVisibility = () => {
        setPasswordVisible((prev) => !prev);
    };

    const inputType = showPasswordToggle && type === 'password'
        ? (isPasswordVisible ? 'text' : 'password')
        : type;

    return (
        <div className={clsx([styles.inputWrapper, styles[size]])}>
            {label && <label htmlFor={props.id} className={styles.label}>{label}</label>}
            <div className={clsx([styles.inputContainer, error && styles.error, wrapperClassName])}>
                {before && <span className={styles.before}>{before}</span>}
                <input
                    ref={ref}
                    type={inputType}
                    className={clsx([styles.inputElement, className, typographyVariant && typoStyle[typographyVariant]])}
                    {...props}
                />
                {showPasswordToggle && type === 'password' ? (
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        aria-pressed={isPasswordVisible}
                        className={styles.toggleButton}
                    >
                        {isPasswordVisible ? '🙈' : '👁️'}
                    </button>
                ) : (
                    after && <span className={styles.after}>{after}</span>
                )}
            </div>
            {helperText && <p className={styles.helperText}>{helperText}</p>}
            {error && <p className={styles.errorText}>{error}</p>}
        </div>
    );
});

Input.displayName = "Input";

export default Input;
