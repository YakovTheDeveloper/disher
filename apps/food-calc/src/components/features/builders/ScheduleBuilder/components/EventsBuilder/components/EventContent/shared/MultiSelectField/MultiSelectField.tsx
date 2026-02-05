import React from 'react';
import styles from './MultiSelectField.module.scss';
import { SelectableItem } from '@/components/ui/SelectableItem';
import clsx from 'clsx';

type Option = {
  value: string;
  label: string;
};

type Props = {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  label?: string;
  className?: string;
};

const MultiSelectField = ({ options, selectedValues, onChange, label, className }: Props) => {
  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  return (
    <div className={clsx(styles.container, className)}>
      {label && <div className={styles.label}>{label}</div>}
      <div className={styles.chips}>
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          return (
            <div
              key={option.value}
              className={clsx(styles.chip, isSelected && styles.selected)}
              onClick={() => handleToggle(option.value)}
            >
              {option.label}
              {isSelected && <span className={styles.remove}>×</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MultiSelectField;
