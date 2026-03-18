import * as Dialog from '@radix-ui/react-dialog';
import { observer } from 'mobx-react-lite';
import styles from './Modal.module.scss';
import { modalStore } from '@/shared/ui/modal-store';
import { motion } from 'framer-motion';

interface ModalProps {
  children: React.ReactNode;
}

const ModalComponent = ({ children }: ModalProps) => {
  const v2Open = modalStore.isModalOpen;

  return (
    <Dialog.Root
      open={v2Open}
      onOpenChange={(open) => {
        if (!open && modalStore.isModalOpen) {
          modalStore.closeLast();
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

export default observer(ModalComponent);
