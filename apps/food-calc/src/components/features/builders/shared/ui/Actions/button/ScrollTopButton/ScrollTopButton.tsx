import { observer } from 'mobx-react-lite';
import styles from './ScrollTopButton.module.scss';
import clsx from 'clsx';
import { motion } from 'framer-motion';

type Props = {
  onClick: VoidFunction;
};

const ScrollTopButton = ({ onClick }: Props) => {
  return (
    <motion.button className={clsx([styles.container])} onClick={onClick}>
      <span className={styles.icon}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 19V5M5 12l7-7 7 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </motion.button>
  );
};

export default observer(ScrollTopButton);
