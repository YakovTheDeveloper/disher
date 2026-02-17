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
  headerCenter?: React.ReactNode;
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
  showCloseButton?: boolean;
  showBackButton?: boolean;
};

const ModalLayout = ({
  children,
  headerCenter,
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
  showCloseButton = false,
  showBackButton = false,
}: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { keyboardVisible } = useKeyboardDetection();

  // Determine button visibility: explicit props override implicit onBack
  const showBack = showBackButton || (onBack !== undefined && !showCloseButton);
  const showClose = showCloseButton || (!showBackButton && onBack === undefined);

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
            [styles.keyboardVisible]: keyboardVisible,
          })}
        >
          <AnimatePresence mode="popLayout">
            {showHeader && (
              <motion.header
                layout
                className={styles.header}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
              >
                <div className={styles.headerLeft}>
                  {showBack ? (
                    <button className={styles.iconButton} onClick={onBack}>
                      <BackIcon />
                    </button>
                  ) : showClose ? (
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
                  ) : null}
                </div>

                <div className={styles.headerCenter}>
                  {title && <div className={styles.title}>{title}</div>}
                  {headerCenter}
                </div>

                <div className={styles.headerRight}>{topRight}</div>
              </motion.header>
            )}
          </AnimatePresence>

          {subHeader && <div className={styles.subHeader}>{subHeader}</div>}

          <motion.main
            // ref={scrollRef}
            className={styles.content}
            layout
            transition={{ duration: 0.1, ease: 'easeOut' }}
          >
            {children}
          </motion.main>

          {supFooter && <footer className={styles.supFooter}>{supFooter}</footer>}
          {footer && <footer className={styles.footer}>{footer}</footer>}

          {/* {background && <div className={styles.background}>{background}</div>} */}
        </div>
      </motion.div>
    </Dialog.Content>
  );
};

export default observer(ModalLayout);
