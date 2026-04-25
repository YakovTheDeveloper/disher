import * as Dialog from '@radix-ui/react-dialog';
import styles from './Modal.module.scss';
import { useModals } from '@/shared/ui/modal-store';
import { motion } from 'motion/react';

interface ModalProps {
  children: React.ReactNode;
}

const ModalComponent = ({ children }: ModalProps) => {
  const { isOpen, closeLast } = useModals();

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && isOpen) {
          closeLast();
        }
      }}
    >
      <Dialog.Portal container={document.getElementById('modal-root')}>
        <Dialog.Overlay asChild>
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            exit={{ opacity: 0 }}
          />
        </Dialog.Overlay>
        {children}
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ModalComponent;
