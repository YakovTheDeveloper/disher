import { FC } from 'react';
import clsx from 'clsx';
import styles from './Ornament.module.scss';

type Props = {
  text?: string;
  className?: string;
  variant?: 'default' | 'horizontal';
};

const Ornament: FC<Props> = ({ text, className, variant = 'default' }) => {
  if (variant === 'horizontal') {
    return (
      <div className={clsx(styles.horizontal, className)}>
        {text && <span className={styles.text}>{text}</span>}
      </div>
    );
  }

  return (
    <div className={clsx(styles.ornament, className)}>
      <span className={styles.line} />
      {text && <span className={styles.text}>{text}</span>}
      <span className={styles.line} />
    </div>
  );
};

export default Ornament;
