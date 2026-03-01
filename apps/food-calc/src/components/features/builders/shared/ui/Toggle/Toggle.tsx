import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import styles from './Toggle.module.scss';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  labels?: { on: string; off: string };
  disabled?: boolean;
  className?: string;
};

const Toggle = observer(({ checked, onChange, label, labels, disabled, className }: Props) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div className={clsx(styles.container, className)}>
      {label && <span className={styles.label}>{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={clsx(styles.toggle, {
          [styles.checked]: checked,
          [styles.disabled]: disabled,
        })}
        onClick={handleToggle}
        disabled={disabled}
      >
        <span className={styles.thumb} />
        {labels && (
          <span className={styles.labels}>
            <span className={clsx(styles.modeLabel, { [styles.active]: !checked })}>
              {labels.off}
            </span>
            <span className={clsx(styles.modeLabel, { [styles.active]: checked })}>
              {labels.on}
            </span>
          </span>
        )}
      </button>
    </div>
  );
});

export default Toggle;
