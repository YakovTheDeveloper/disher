import { observer } from 'mobx-react-lite';
import styles from './LabeledCheckbox.module.scss';
import React from 'react';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  disabled?: boolean;
  id?: string;
};

const LabeledCheckbox = ({ checked, onChange, label, disabled = false, id }: Props) => {
  const handleChange = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <label className={`${styles.container} ${disabled ? styles.disabled : ''}`} htmlFor={id}>
      <input
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
