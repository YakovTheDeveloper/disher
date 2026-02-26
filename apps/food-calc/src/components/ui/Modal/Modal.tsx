import * as Dialog from '@radix-ui/react-dialog';
import { observer } from 'mobx-react-lite';
import styles from './Modal.module.scss';
import { modalStoreV2 } from '@/store/GlobalUiStore/ModalStoreV2/ModalStoreV2';
import { motion } from 'framer-motion';

interface ModalProps {
  children: React.ReactNode;
}

const ModalComponent = ({ children }: ModalProps) => {
  // Subscribe to modalStoreV2 to trigger re-render when modals change
  const v2Open = modalStoreV2.isModalOpen;

  return (
    <Dialog.Root
      open={v2Open}
      onOpenChange={(open) => {
        if (!open && modalStoreV2.isModalOpen) {
          modalStoreV2.closeLast();
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
