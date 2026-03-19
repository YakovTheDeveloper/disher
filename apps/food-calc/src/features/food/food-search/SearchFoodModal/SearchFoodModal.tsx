import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import styles from './SearchFoodModal.module.scss';

interface SearchFoodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpen?: () => void;
  children: ReactNode;
}

const SearchFoodModal = ({ open, onOpenChange, onOpen, children }: SearchFoodModalProps) => {
  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen && onOpen) {
      onOpen();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal container={document.getElementById('modal-root')}>
            <Dialog.Overlay asChild>
              <motion.div
                className={styles.overlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className={styles.content}
                initial={{ transform: 'translateY(100%)' }}
                animate={{ transform: 'translateY(0)' }}
                exit={{ transform: 'translateY(100%)' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};

export default SearchFoodModal;
