import { forwardRef, useRef } from 'react';
import styles from './NumberInput.module.scss';
import clsx from 'clsx';

type Props = {
  id?: string;
  value: number;
  onBlur?: (current: number) => void;
  onChange?: (current: number) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  boxShadow?: boolean;
  size?: 'small' | 'big';
  color?: 'grey' | 'white';
  variant?: 'default' | 'underline';
  disabled?: boolean;
  bottom?: React.ReactNode;
  min?: number;
};

const NumberInput = forwardRef<HTMLInputElement, Props>(
  (
    {
      id,
      value,
      onBlur,
      className,
      placeholder,
      autoFocus,
      boxShadow,
      onChange,
      size,
      color,
      variant,
      disabled,
      bottom,
    },
    _ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleBlur = () => {
      onBlur?.(value);
    };

    const handleFocus = () => {
      setTimeout(() => {
        inputRef.current?.select();
      });
    };

    const input = (
      <input
        disabled={disabled}
        autoFocus={autoFocus}
        ref={inputRef}
        id={id}
        inputMode="numeric"
        pattern="[0-9]*"
        onFocus={handleFocus}
        className={clsx([
          styles.input,
          boxShadow && styles.boxShadow,
          color && styles[color],
          size && styles[size],
          variant && styles[variant],
          className,
        ])}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, '');
          onChange?.(val === '' ? 0 : Number(val));
        }}
        onBlur={handleBlur}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onPaste={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      />
    );

    if (bottom) {
      return (
        <div className={styles.wrapper}>
          {input}
          <span className={styles.bottom}>{bottom}</span>
        </div>
      );
    }

    return input;
  }
);

NumberInput.displayName = 'NumberInput';

export default NumberInput;
