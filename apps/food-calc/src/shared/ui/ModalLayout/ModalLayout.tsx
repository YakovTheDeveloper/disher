import styles from './ModalLayout.module.scss';
import { motion } from 'motion/react';
import clsx from 'clsx';
import * as Dialog from '@radix-ui/react-dialog';

type Props = {
  children: React.ReactNode;
  className?: string;
};

const ModalLayout = ({ children, className }: Props) => {
  return (
    <Dialog.Content className={styles.modal}>
      <div
        className={clsx(styles.container, className, {
          [styles.keyboardVisible]: false,
        })}
      >
        <motion.main
          className={styles.content}
          layout
          transition={{ duration: 0.1, ease: 'easeOut' }}
        >
          {children}
        </motion.main>
      </div>
    </Dialog.Content>
  );
};

export default ModalLayout;
