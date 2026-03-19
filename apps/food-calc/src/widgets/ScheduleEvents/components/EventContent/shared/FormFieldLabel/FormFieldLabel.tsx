import React from 'react';
import styles from './FormFieldLabel.module.scss';
import clsx from 'clsx';

type Props = {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  aside?: React.ReactNode;
};

const FormFieldLabel = ({ label, required, error, className, aside }: Props) => {
  return (
    <label className={clsx(styles.label, error && styles.error, className)}>
      <div className={styles.content}>
        <span className={styles.text}>{label}</span>
        {required && <span className={styles.required}>*</span>}
      </div>
      {aside && <div className={styles.aside}>{aside}</div>}
    </label>
  );
};

export default FormFieldLabel;
