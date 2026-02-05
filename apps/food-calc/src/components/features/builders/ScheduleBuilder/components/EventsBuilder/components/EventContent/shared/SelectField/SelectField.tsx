import React from 'react';
import styles from './SelectField.module.scss';
import clsx from 'clsx';
import SelectableInput from '@/components/ui/atoms/Button/SelectableInput/SelectableInput';

type Option = {
  value: string;
  label: string;
};

type Props = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
};

const SelectField = ({ options, value, onChange, label, className }: Props) => {
  return (
    <div className={clsx(styles.container, className)}>
      {label && <div className={styles.label}>{label}</div>}
      <div className={styles.options}>
        {options.map((option) => (
          <SelectableInput
            key={option.value}
            id={option.value}
            name="select"
            type="radio"
            isChecked={value === option.value}
            onChange={onChange}
            label={option.label}
          />
        ))}
      </div>
    </div>
  );
};

export default SelectField;
