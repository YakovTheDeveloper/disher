import { observer } from 'mobx-react-lite';
import styles from './FinishButton.module.scss';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import TickIcon from '@/assets/icons/tick.svg';

type Props = {
  children?: React.ReactNode;
  onClick: () => void;
};

const FinishButton = ({ children, onClick }: Props) => {
  return (
    <button onClick={onClick} className={styles.finishButton}>
      <TickIcon />
    </button>
  );
};

export default observer(FinishButton);
