import styles from './LabeledCheckbox.module.scss';
import React, { MutableRefObject } from 'react';
import { Text } from '@/shared/ui/atoms/Typography';

type Props = {
  checked?: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  disabled?: boolean;
  id?: string;
  ref?: MutableRefObject<any>;
};

const LabeledCheckbox = ({ checked, onChange, label, disabled = false, id, ref }: Props) => {
  const handleChange = () => {
    if (!disabled) {
      onChange?.(!checked);
    }
  };

  return (
    <label className={`${styles.container} ${disabled ? styles.disabled : ''}`} htmlFor={id}>
      <input
        ref={ref}
        type="checkbox"
        id={id}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className={styles.checkbox}
      />
      <Text role="label" as="span" className={styles.label}>
        {label}
      </Text>
    </label>
  );
};

export default LabeledCheckbox;
