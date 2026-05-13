import styles from './ModalLayout.module.scss';
import { motion } from 'motion/react';
import clsx from 'clsx';
import { Dialog } from '@base-ui/react/dialog';
import { useTranslation } from 'react-i18next';

type Props = {
  children: React.ReactNode;
  className?: string;
  a11yLabel?: string;
};

const ModalLayout = ({ children, className, a11yLabel }: Props) => {
  const { t } = useTranslation();

  return (
    <Dialog.Popup className={styles.modal}>
      <Dialog.Title className={styles.srOnly}>
        {a11yLabel ?? t('overlay.modal.defaultA11yLabel', 'Модальное окно')}
      </Dialog.Title>
      <div className={clsx(styles.container, className)}>
        <motion.main
          className={styles.content}
          layout
          transition={{ duration: 0.1, ease: 'easeOut' }}
        >
          {children}
        </motion.main>
      </div>
    </Dialog.Popup>
  );
};

export default ModalLayout;
