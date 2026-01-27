import { observer } from 'mobx-react-lite';
import styles from './ModalLayout.module.scss';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { useRef } from 'react';
import BackIcon from '@/assets/icons/arrowLeftLong.svg';
import { useKeyboardDetection } from '../DrawerLayout/useKeyboardDetection';
import * as Dialog from '@radix-ui/react-dialog';
import { domainStore } from '@/store/store';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';

type Props = {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  supFooter?: React.ReactNode;
  onBack?: () => void;
  // onClose?: () => void;
  title?: React.ReactNode;
  topRight?: React.ReactNode;
  background?: React.ReactNode;
  subHeader?: React.ReactNode;
  className?: string;
  modalStore?: ModalStoreInstance;
  showHeader?: boolean;
};

const ModalLayout = ({
  children,
  header,
  footer,
  supFooter,
  onBack,
  title,
  topRight,
  background,
  subHeader,
  modalStore = domainStore.globalUiStore.modalStore,
  showHeader = true,
  className,
}: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { keyboardVisible } = useKeyboardDetection();

  return (
    <Dialog.Content asChild>
      <motion.div
        className={styles.modal}
        initial={{ y: '20%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '20%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      >
        <button
          className={styles.closeButton}
          // aria-label="Close"
          onClick={(e) => {
            e.stopPropagation();
            modalStore.closeModal();
          }}
        >
          ×
        </button>

        <div
          className={clsx(styles.container, className, {
            [styles.keyboardVisible]: keyboardVisible,
          })}
        >
          {showHeader && (
            <header className={styles.header}>
              <div className={styles.headerLeft}>
                {onBack ? (
                  <button className={styles.iconButton} onClick={onBack}>
                    <BackIcon />
                  </button>
                ) : null}
              </div>

              <div className={styles.headerCenter}>
                {title && <div className={styles.title}>{title}</div>}
                {header}
              </div>

              <div className={styles.headerRight}>{topRight}</div>
            </header>
          )}

          {subHeader && <div className={styles.subHeader}>{subHeader}</div>}

          <main ref={scrollRef} className={styles.content}>
            {children}
          </main>

          {supFooter && <footer className={styles.supFooter}>{supFooter}</footer>}
          {footer && <footer className={styles.footer}>{footer}</footer>}

          {background && <div className={styles.background}>{background}</div>}
        </div>
      </motion.div>
    </Dialog.Content>
  );
};

export default observer(ModalLayout);
