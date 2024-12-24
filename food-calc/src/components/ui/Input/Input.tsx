import React, { useState, forwardRef, InputHTMLAttributes } from 'react';
import styles from './Input.module.css';
import { TypographyProps } from '@/components/ui/Typography/Typography';
import clsx from 'clsx';
import typoStyle from '@/components/ui/Typography/Typography.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    showPasswordToggle?: boolean; // New optional prop
    typographyVariant?: TypographyProps['variant'];
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    helperText,
    showPasswordToggle = false, // Default to false for other use cases
    typographyVariant,
    className,
    type,
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
        <div className={`${styles.inputWrapper} ${className || ''}`}>
            {label && <label htmlFor={props.id} className={styles.label}>{label}</label>}
            <div className={`${styles.inputContainer} ${error ? styles.error : ''}`}>
                <input
                    ref={ref}
                    type={inputType}
                    className={clsx([styles.inputElement, typographyVariant && typoStyle[typographyVariant]])}
                    {...props}
                />
                {showPasswordToggle && type === 'password' && (
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        aria-pressed={isPasswordVisible}
                        className={styles.toggleButton}
                    >
                        {isPasswordVisible ? '🙈' : '👁️'}
                    </button>
                )}
            </div>
            {helperText && <p className={styles.helperText}>{helperText}</p>}
            {error && <p className={styles.errorText}>{error}</p>}
        </div>
    );
});

Input.displayName = "Input";

export default Input;
