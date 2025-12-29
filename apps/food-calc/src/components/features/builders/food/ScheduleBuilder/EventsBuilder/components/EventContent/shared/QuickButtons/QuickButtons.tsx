import React from 'react';
import styles from './QuickButtons.module.scss';

type Props<T> = {
  options: T[];
  selectedValue: T;
  onSelect: (value: T) => void;
};

const QuickButtons = <T,>({ options, selectedValue, onSelect }: Props<T>) => {
  return (
    <div className={styles.quickButtons}>
      {options.map((option) => (
        <button
          key={String(option)}
          type="button"
          className={`${styles.quickButton} ${selectedValue === option ? styles.activeButton : ''}`}
          onClick={() => onSelect(option)}
        >
          {String(option)}
        </button>
      ))}
    </div>
  );
};

export default QuickButtons;
