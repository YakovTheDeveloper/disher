import { observer } from 'mobx-react-lite';
import styles from './LabeledCheckbox.module.scss';
import React, { MutableRefObject } from 'react';

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
      <span className={styles.label}>{label}</span>
    </label>
  );
};

export default observer(LabeledCheckbox);
