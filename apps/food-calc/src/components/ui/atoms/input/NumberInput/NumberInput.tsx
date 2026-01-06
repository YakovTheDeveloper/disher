import { forwardRef, useImperativeHandle, useRef } from 'react';
import { observer } from 'mobx-react-lite';
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
};

const NumberInput = forwardRef<HTMLInputElement, Props>(
  (
    { id, value, onBlur, className, placeholder, autoFocus, boxShadow, onChange, size, color },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => inputRef.current!, []);

    const handleBlur = () => {
      onBlur?.();
    };

    const handleFocus = () => {
      setTimeout(() => {
        inputRef.current?.select();
      });
    };

    return (
      <input
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
  }
);

NumberInput.displayName = 'NumberInput';

export default observer(NumberInput);
