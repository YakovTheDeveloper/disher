import { observer } from 'mobx-react-lite';
import styles from './ModalLayout.module.scss';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import * as Dialog from '@radix-ui/react-dialog';

type Props = {
  children: React.ReactNode;
  className?: string;
};

const ModalLayout = ({ children, className }: Props) => {
  // const { keyboardVisible } = useKeyboardDetection();

  return (
    <Dialog.Content asChild>
      <motion.div
        className={styles.modal}
        initial={{ y: '20%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '20%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      >
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
      </motion.div>
    </Dialog.Content>
  );
};

export default observer(ModalLayout);
