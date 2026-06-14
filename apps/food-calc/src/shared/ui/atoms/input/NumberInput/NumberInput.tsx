import { forwardRef, useRef, useState } from 'react';
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
  maxLength?: number;
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
      maxLength,
    },
    _ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);

    // Draft lets the field show an empty string while the user is editing
    // (backspacing the last digit) without snapping to "0". The emitted
    // contract is unchanged — onChange still fires a number (0 on empty).
    // We re-sync the draft only when the external `value` no longer matches
    // what the draft represents (programmatic set / clamp by the parent).
    const [draft, setDraft] = useState<string>(() => String(value));
    const draftNum = draft === '' ? 0 : Number(draft);
    if (value !== draftNum) {
      setDraft(String(value));
    }

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
        maxLength={maxLength}
        data-base-ui-swipe-ignore=""
        onFocus={handleFocus}
        className={clsx([
          styles.input,
          boxShadow && styles.boxShadow,
          color && styles[color],
          size && styles[size],
          variant && styles[variant],
          className,
        ])}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => {
          let val = e.target.value.replace(/\D/g, '');
          if (maxLength != null) val = val.slice(0, maxLength);
          setDraft(val);
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
