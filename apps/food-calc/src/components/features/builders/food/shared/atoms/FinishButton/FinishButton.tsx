import { observer } from 'mobx-react-lite';
import styles from './FinishButton.module.scss';
import clsx from 'clsx';
import { motion } from 'framer-motion';

type Props = {
  children?: React.ReactNode;
  maxStepReached: boolean;
  onClick: () => void;
};

const FinishButton = ({ children, maxStepReached, onClick }: Props) => {
  return (
    <motion.button
      disabled={!maxStepReached}
      className={clsx([styles.finishButton, maxStepReached && styles.finishButton_active])}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={maxStepReached ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      onClick={onClick}
    >
      {children || 'Окей'}
    </motion.button>
  );
};

export default observer(FinishButton);
