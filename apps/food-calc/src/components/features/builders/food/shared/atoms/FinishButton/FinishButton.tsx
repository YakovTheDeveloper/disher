import { observer } from 'mobx-react-lite';
import styles from './FinishButton.module.scss';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import TickIcon from '@/assets/icons/tick.svg';

type Props = {
  children?: React.ReactNode;
  onClick: () => void;
  variant?: 'text' | 'tick';
};

const FinishButton = ({ children, onClick, variant = 'tick' }: Props) => {
  if (variant === 'tick')
    return (
      <button
        onClick={onClick}
        className={clsx([styles.finishButton, styles[`finishButton_${variant}`]])}
      >
        <span className={styles.iconContainer}>
          <TickIcon />
        </span>
      </button>
    );
  return (
    <button
      onClick={onClick}
      className={clsx([styles.finishButton, styles[`finishButton_${variant}`]])}
    >
      {children}
    </button>
  );
};

export default observer(FinishButton);
