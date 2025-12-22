import { useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import styles from './NumberInput.module.scss';

type Props = {
  id?: string;
  value: number | null | undefined;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  useLocalValue?: boolean; // <— NEW
};

const NumberInput = ({
  id,
  value,
  onChange,
  className,
  placeholder,
  useLocalValue = false,
}: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Local state only when needed
  const [localValue, setLocalValue] = useState<string>(value?.toString() ?? '');

  const displayedValue = useLocalValue ? localValue : (value ?? '');

  const handleLocalChange = (v: string) => {
    setLocalValue(v);
  };

  const handleBlur = () => {
    if (!useLocalValue) return;

    const numeric = Number(localValue);
    onChange(Number.isNaN(numeric) ? 0 : numeric);
  };

  const handleImmediateChange = (v: string) => {
    const numeric = Number(v);
    if (!Number.isNaN(numeric)) {
      onChange(numeric);
    } else {
      onChange(0);
    }
  };

  const handleFocus = () => {
    setTimeout(() => inputRef.current?.select());
  };

  return (
    <input
      ref={inputRef}
      id={id}
      type="number"
      inputMode="decimal"
      className={`${styles.input} ${className || ''}`}
      value={displayedValue}
      onFocus={handleFocus}
      placeholder={placeholder}
      onChange={(e) =>
        useLocalValue ? handleLocalChange(e.target.value) : handleImmediateChange(e.target.value)
      }
      onBlur={handleBlur}
    />
  );
};

export default observer(NumberInput);
