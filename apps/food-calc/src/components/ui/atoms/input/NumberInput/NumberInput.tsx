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

const NumberInput = ({ id, value, onChange, className, placeholder }: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (inputValue: string) => {
    const numericValue = Number(inputValue);
    if (!Number.isNaN(numericValue)) {
      onChange(numericValue);
    }
  };

  const handleFocus = () => {
    setTimeout(() => {
      inputRef.current?.select();
    });
  };

  return (
    <input
      ref={inputRef}
      id={id}
      type="number"
      inputMode="decimal"
      className={`${styles.input} ${className || ''}`}
      value={value ?? ''}
      onFocus={handleFocus}
      placeholder={placeholder}
      onChange={(e) => handleChange(e.target.value)}
    />
  );
};

export default observer(NumberInput);
