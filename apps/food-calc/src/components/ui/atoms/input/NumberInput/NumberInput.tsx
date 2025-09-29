import { useRef } from 'react';
import { observer } from 'mobx-react-lite';
import styles from './NumberInput.module.scss';

type Props = {
  id?: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  className?: string;
  placeholder?: string;
};

/**
 * Generic NumberInput component that:
 * - Supports controlled numeric input (nullable)
 * - Keeps empty string when cleared
 * - Restores previous value on blur if input is invalid
 */
const NumberInput = ({ id, value, onChange, className, placeholder }: Props) => {
  const prev = useRef<number | null>(null);

  const handleChange = (inputValue: string) => {
    prev.current = null;
    if (inputValue === '') {
      onChange(null);
      return;
    }

    const numericValue = Number(inputValue);
    if (!Number.isNaN(numericValue)) {
      onChange(numericValue);
    }
  };

  const handleFocus = () => {
    prev.current = value ?? null;
    onChange(null); // clear current value
  };

  const handleBlur = () => {
    if (value === null && prev.current !== null) {
      onChange(prev.current); // restore previous value
    }
  };

  return (
    <input
      id={id}
      type="number"
      inputMode="decimal"
      className={`${styles.input} ${className || ''}`}
      value={value ?? ''}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      onChange={(e) => handleChange(e.target.value)}
    />
  );
};

export default observer(NumberInput);
