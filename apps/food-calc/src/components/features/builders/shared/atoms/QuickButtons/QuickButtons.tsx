import styles from './QuickButtons.module.scss';
import clsx from 'clsx';

type Props<T> = {
  options: T[];
  selectedValue: T;
  onSelect: (value: T) => void;
  className?: string;
};

const QuickButtons = <T,>({ className, options, selectedValue, onSelect }: Props<T>) => {
  return (
    <div className={clsx([styles.quickButtons, className])}>
      {options.map((option) => (
        <button
          key={String(option)}
          type="button"
          className={`${selectedValue === option ? 'is-selected' : ''} ${styles.quickButton} `}
          onClick={() => onSelect(option)}
        >
          {String(option)}
        </button>
      ))}
    </div>
  );
};

export default QuickButtons;
