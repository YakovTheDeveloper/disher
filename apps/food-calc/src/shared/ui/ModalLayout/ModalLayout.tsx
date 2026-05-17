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
          // Step morph: glide instead of snap. The footer / «Далее» button
          // rides the layout reflow — at duration 0.1 it visibly jumped, so
          // a longer run on the drawer-canon cubic-bezier eases it out.
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        >
          {children}
        </motion.main>
      </div>
    </Dialog.Popup>
  );
};

export default ModalLayout;
