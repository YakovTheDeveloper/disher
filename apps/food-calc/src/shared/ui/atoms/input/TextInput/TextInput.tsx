import React, { forwardRef, useState, useCallback, useId } from 'react';
import styles from './TextInput.module.scss';

export interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  variant?: 'outlined' | 'filled';
  fullWidth?: boolean;
  success?: boolean;
  loading?: boolean;
  onClear?: () => void;
  showClearButton?: boolean;
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      error,
      helperText,
      startAdornment,
      endAdornment,
      size = 'small',
      variant = 'outlined',
      fullWidth = false,
      success = false,
      loading = false,
      disabled = false,
      required = false,
      onClear,
      showClearButton = false,
      className = '',
      value,
      onChange,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const errorId = useId();
    const helperTextId = useId();

    const hasValue = value !== undefined && value !== '';

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      [onFocus]
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        onBlur?.(e);
      },
      [onBlur]
    );

    const handleClear = useCallback(() => {
      onClear?.();
    }, [onClear]);

    const containerClasses = [styles.container, fullWidth && styles.fullWidth, className]
      .filter(Boolean)
      .join(' ');

    const wrapperClasses = [
      styles.inputWrapper,
      styles[size],
      styles[variant],
      isFocused && styles.focused,
      error && styles.error,
      success && styles.success,
      disabled && styles.disabled,
      hasValue && styles.hasValue,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={containerClasses}>
        {label && (
          <label htmlFor={props.id} className={styles.label}>
            {label}
            {required && (
              <span className={styles.required} aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        <div className={wrapperClasses}>
          {startAdornment && <div className={styles.startAdornment}>{startAdornment}</div>}

          <input
            ref={ref}
            id={props.id}
            className={styles.input}
            disabled={disabled || loading}
            required={required}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperTextId : undefined}
            {...props}
          />

          {loading && (
            <div className={styles.endAdornment}>
              <div className={styles.spinner} role="status" aria-label="Loading" />
            </div>
          )}

          {!loading && showClearButton && hasValue && !disabled && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClear}
              aria-label="Clear input"
              tabIndex={-1}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M15 5L5 15M5 5L15 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}

          {!loading && endAdornment && <div className={styles.endAdornment}>{endAdornment}</div>}
        </div>

        {error && (
          <p id={errorId} className={styles.errorText} role="alert">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={helperTextId} className={styles.helperText}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';
export default TextInput;
