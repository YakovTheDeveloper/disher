import * as Dialog from '@radix-ui/react-dialog';
import { observer } from 'mobx-react-lite';
import styles from './Modal.module.scss';
import { ModalStoreInstance } from '../../../store/GlobalUiStore/ModalStore/ModalStore';
import { domainStore } from '@/store/store';
import { motion, AnimatePresence } from 'framer-motion';
import { modalStoreV2 } from '@/store/GlobalUiStore/ModalStoreV2/ModalStoreV2';

interface ModalProps {
  modalStore?: ModalStoreInstance;
  children: React.ReactNode;
}

const ModalComponent = ({
  modalStore = domainStore.globalUiStore.modalStore,
  children,
}: ModalProps) => {
  const currentModal = modalStore.currentModal;
  // Subscribe to modalStoreV2 to trigger re-render when modals change
  const v2Open = modalStoreV2.isModalOpen;

  return (
    <Dialog.Root
      open={!!currentModal || v2Open}
      onOpenChange={(open) => {
        if (!open) {
          modalStore.closeModal();
          if (modalStoreV2.isModalOpen) {
            modalStoreV2.closeLast();
          }
        }
      }}
    >
      <Dialog.Portal container={document.getElementById('modal-root')}>
        <Dialog.Overlay asChild onClick={() => modalStore.closeModal()}>
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            exit={{ opacity: 0 }}
          />
        </Dialog.Overlay>
        {children}
        {/* <Dialog.Content className={styles.modal}>
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

          {children}
        </Dialog.Content> */}
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default observer(ModalComponent);
