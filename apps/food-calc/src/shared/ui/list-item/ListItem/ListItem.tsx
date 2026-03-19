import { ReactNode } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ListItem.module.scss';

type Props = {
  children: ReactNode;
  before?: ReactNode;
  after?: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

const ListItem = ({ children, before, after, active, onClick, className }: Props) => {
  return (
    <motion.li
      layout
      className={clsx(styles.root, active && styles.root_active, className)}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <AnimatePresence>
        {before && (
          <motion.div
            className={styles.slot}
            initial={{ opacity: 0, width: 0, scale: 0.5 }}
            animate={{ opacity: 1, width: 'auto', scale: 1 }}
            exit={{ opacity: 0, width: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            {before}
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.body} onClick={onClick}>
        <span className={styles.label}>{children}</span>
      </div>

      <AnimatePresence>
        {after && (
          <motion.div
            className={styles.slot}
            initial={{ opacity: 0, width: 0, scale: 0.5 }}
            animate={{ opacity: 1, width: 'auto', scale: 1 }}
            exit={{ opacity: 0, width: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            {after}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
};

export default ListItem;
