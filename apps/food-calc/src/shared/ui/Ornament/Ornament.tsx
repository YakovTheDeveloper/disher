import { FC } from 'react';
import clsx from 'clsx';
import styles from './Ornament.module.scss';

type Props = {
  text?: string;
  className?: string;
};

const Ornament: FC<Props> = ({ text, className }) => {
  return (
    <div className={clsx(styles.ornament, className)}>
      <span className={styles.line} />
      {text && <span className={styles.text}>{text}</span>}
      <span className={styles.line} />
    </div>
  );
};

export default Ornament;
