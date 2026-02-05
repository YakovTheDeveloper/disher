import React from 'react';
import styles from './StepsField.module.scss';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import clsx from 'clsx';

type Props = {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
};

const StepsField = ({
  value,
  onChange,
  label,
  min = 0,
  max = 100000,
  step = 1,
  className,
}: Props) => {
  return (
    <div className={clsx(styles.container, className)}>
      {label && <div className={styles.label}>{label}</div>}
      <NumberInput
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        className={styles.input}
      />
    </div>
  );
};

export default StepsField;
